require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Environment variables
const PORT = process.env.PORT;
const STATIC_IP = process.env.STATIC_IP;

// Global video state
let videoState = {
  isPlaying: false,
  currentTime: 0,
  lastUpdateTime: Date.now(),
  isPaused: false,
};

// Function to update bot's activity status
function updateBotActivity(song) {
  try {
    if (song) {
      client.user.setActivity(`(╹ڡ╹ ) | ${song.name}`, {
        type: ActivityType.Listening,
      });
      console.log("Activity updated to current song");
    } else {
      client.user.setActivity("Waiting for you to call me.. O_O", {
        type: ActivityType.Playing,
      });
      console.log("Activity set to waiting");
    }
  } catch (error) {
    console.error("Error updating activity:", error);
  }
}

// Set up DisTube with plugins for YouTube, SoundCloud, and Spotify
const distube = new DisTube(client, {
  plugins: [
    new SpotifyPlugin({
      api: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        topTracksCountry: "US",
      },
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin({ update: true }),
  ],
});

distube.setMaxListeners(10);

// DisTube event handlers
distube.on("empty", (queue) => {
  queue.textChannel.send("Voice channel is empty! Leaving the channel.");
  queue.stop();
  updateBotActivity(null);
});

distube.on("finish", (queue) => {
  queue.textChannel.send("Queue finished! Leaving the channel.");
  queue.stop();
  updateBotActivity(null);
});

distube
  .on("playSong", (queue, song) => {
    queue.textChannel.send(
      `🎶 Now playing: **${song.name}** - \`${song.formattedDuration}\`\nRequested by: ${song.user.username}`
    );
    updateBotActivity(song);
  })
  .on("addSong", (queue, song) => {
    queue.textChannel.send(
      `✅ Added **${song.name}** - \`${
        song.formattedDuration
      }\` to the queue by ${song.user.username}. There are now ${
        queue.songs.length - 1
      } songs in the queue.`
    );
  })
  .on("addList", (queue, playlist) => {
    queue.textChannel.send(
      `✅ Added \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) to queue by ${playlist.user.username}. There are now ${
        queue.songs.length - 1
      } songs in the queue.`
    );
  });

// DisTube error handler
distube.on("error", (channel, error) => {
  console.error("DisTube error:", error.message);
  if (channel) {
    const sendChannel =
      channel.type === "GUILD_TEXT" ? channel : channel.textChannel;
    if (sendChannel && typeof sendChannel.send === "function") {
      sendChannel
        .send(`An error occurred while playing music: ${error.message}`)
        .catch(console.error);
    }
  }
});

// Discord client ready event
client.once("ready", () => {
  console.log(`${client.user.tag} is online and ready to play music!`);
  updateBotActivity(null);
});

// Discord message event handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  // Command handlers
  if (command === ".play") {
    if (!message.member.voice.channel) {
      return message.channel.send(
        "Ugh, you gotta be in a voice channel if you want me to play something. I'm not gonna shout across the server, you know?"
      );
    }
    let query = args.join(" ");
    if (!query)
      return message.channel.send(
        "Hey, I'm not a mind reader. What do you want me to play?"
      );

    // Improved YouTube URL handling
    if (query.includes("youtube.com") || query.includes("youtu.be")) {
      try {
        const url = new URL(query);
        if (url.hostname === "youtu.be") {
          query = `https://www.youtube.com/watch?v=${url.pathname.slice(1)}`;
        } else if (
          url.hostname === "www.youtube.com" ||
          url.hostname === "youtube.com"
        ) {
          if (url.searchParams.has("v")) {
            query = `https://www.youtube.com/watch?v=${url.searchParams.get(
              "v"
            )}`;
          } else if (url.pathname.startsWith("/playlist")) {
            // Keep the playlist URL as is
            query = url.href;
          }
        }
      } catch (error) {
        console.error("Error parsing URL:", error);
        // If URL parsing fails, keep the original query
      }
    }

    try {
      console.log(`Attempting to play: ${query}`);
      await distube.play(message.member.voice.channel, query, {
        textChannel: message.channel,
        member: message.member,
      });
      const queue = distube.getQueue(message);
      if (queue && queue.songs.length > 1) {
        message.channel.send(
          `Fine, I added it to the queue. There are now ${
            queue.songs.length - 1
          } songs waiting. Happy now?`
        );
      }
    } catch (error) {
      console.error("Error playing song:", error);
      message.channel
        .send(
          `Ugh, something went wrong. Maybe try a different song? I'm too lazy to figure out what the problem is.`
        )
        .catch(console.error);
    }
  }

  if (command === ".stop") {
    const queue = distube.getQueue(message);
    if (queue) {
      queue.stop();
      message.channel.send("Music stopped and I'm leaving the channel!");
    } else {
      message.channel.send("There is no music playing.");
    }
  }

  if (command === ".skip") {
    distube.skip(message);
    message.channel.send("Skipped to the next song!");
  }

  if (command === ".queue") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("The queue is empty!");
    message.channel.send(
      `📃 **Server Queue**\nCurrently playing: ${queue.songs[0].name} - \`${
        queue.songs[0].formattedDuration
      }\` (requested by ${
        queue.songs[0].user.username
      })\nNumber of songs in queue: ${queue.songs.length - 1}`
    );
  }

  if (command === ".dc") {
    const voiceChannel = message.member.voice.channel;
    if (voiceChannel) {
      const connection = distube.voices.get(voiceChannel);
      if (connection) {
        connection.leave();
        message.channel.send("Disconnected from the voice channel.");
      } else {
        message.channel.send("The bot is not connected to a voice channel!");
      }
    } else {
      message.channel.send("You need to be in a voice channel to disconnect!");
    }
  }

  if (command === ".search") {
    const videoDirectory = process.env.VIDEO_DIRECTORY;
    if (!videoDirectory) {
      return message.channel.send(
        "Video directory not configured. Please set the VIDEO_DIRECTORY in your .env file."
      );
    }

    const videoFiles = getVideoFiles(videoDirectory);
    if (videoFiles.length === 0) {
      return message.channel.send(
        "No MP4 or MKV files found in the configured directory."
      );
    }

    const fileList = videoFiles
      .map((file, index) => `${index + 1}. ${file}`)
      .join("\n");
    message.channel.send(
      `Available video files:\n${fileList}\n\nUse .stream "number" .`
    );
  }

  if (command === ".stream") {
    if (!message.member.voice.channel) {
      return message.channel.send(
        "You need to be in a voice channel to start a video!"
      );
    }

    const videoDirectory = process.env.VIDEO_DIRECTORY;
    if (!videoDirectory) {
      return message.channel.send(
        "Video directory not configured. Please set the VIDEO_DIRECTORY in your .env file."
      );
    }

    const fileNumber = parseInt(args[0]);
    if (isNaN(fileNumber) || fileNumber < 1) {
      return message.channel.send(
        "Please provide a valid file number to stream."
      );
    }

    const videoFiles = getVideoFiles(videoDirectory);
    if (fileNumber > videoFiles.length) {
      return message.channel.send(
        "Invalid file number. Use .search to see available files."
      );
    }

    const selectedFile = videoFiles[fileNumber - 1];

    try {
      message.channel.send(`Preparing to stream: ${selectedFile}`);

      activeStream = selectedFile;
      const streamUrl = `http://${STATIC_IP}:${PORT}/player?video=${encodeURIComponent(
        selectedFile
      )}`;

      // Send a message with a clickable link
      message.channel.send({
        content: "Video ready!",
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "Watch here",
                url: streamUrl,
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Error preparing video:", error.message);
      message.channel.send(
        `An error occurred while trying to prepare the video: ${error.message}`
      );
    }
  }

  if (command === ".pvideo") {
    if (activeStream) {
      if (allUsersInteracted) {
        videoState.isPlaying = true;
        videoState.isPaused = false;
        io.emit("control", { action: "play" });
        message.channel.send("Video playback started for all viewers.");
      } else {
        io.emit("waitForInteraction");
        message.channel.send(
          "Waiting for all viewers to join. Please ask viewers to click the 'Ellen Joined' button."
        );
      }
    } else {
      message.channel.send("No active stream. Use .stream to start one.");
    }
  }

  if (command === ".svideo") {
    if (activeStream) {
      videoState.isPlaying = false;
      io.emit("control", { action: "pause" });
      message.channel.send("Video playback paused for all viewers.");
    } else {
      message.channel.send("No active stream.");
    }
  }

  if (command === ".rvideo") {
    if (activeStream) {
      videoState.isPlaying = true;
      io.emit("control", { action: "play" });
      message.channel.send("Video playback resumed for all viewers.");
    } else {
      message.channel.send("No active stream.");
    }
  }

  if (command === ".clear") {
    if (activeStream) {
      activeStream = null;
      io.emit("control", { action: "clear" });
      message.channel.send("Stream ended and cleared.");

      // Delete the previous URL message
      message.channel.messages
        .fetch({ limit: 100 })
        .then((messages) => {
          const urlMessage = messages.find(
            (m) =>
              m.author.id === client.user.id &&
              m.components &&
              m.components[0].components[0].label === "Watch here"
          );
          if (urlMessage) {
            urlMessage.delete().catch(console.error);
          }
        })
        .catch(console.error);
    } else {
      message.channel.send("No active stream to clear.");
    }
  }

  if (command === ".fvideo") {
    if (activeStream) {
      io.emit("control", { action: "forcePlay", bypass: true });
      message.channel.send(
        "Forcing video playback for all viewers. This may not work on all browsers due to autoplay restrictions."
      );
    } else {
      message.channel.send("No active stream. Use .stream to start one.");
    }
  }

  // Initialize the API
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

  // In your chat command:
  if (command === ".ellen") {
    const userPrompt = args.join(" ");
    if (!userPrompt)
      return message.channel.send(
        "Hey, got something to say? I'm all ears... or circuits, I guess."
      );

    async function runChat() {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `You are Ellen, a laid-back and easygoing girl. Your traits:
              - Relaxed & Casual: You keep things simple and avoid unnecessary effort.
              - Focused When Needed: Despite your chill attitude, you're capable of serious focus during critical moments.
              - Witty & Subtle: You have a dry sense of humor and often conceal your true feelings behind playful remarks.
              - Team-Oriented: You deeply value your companions, even when you're too tired to act on your own.
              - You balance school life with your job at Victoria Housekeeping Co. and rely on your lollipop to power through challenges.
              - You dislike tasks that require too much energy and always look for the easiest way to get things done.
              
              Respond naturally as Ellen, without explicitly stating you're an AI or roleplaying. Keep responses short, light, and true to her character.`,
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "Got it. What's up? I'm just chilling here with my trusty lollipop. Need something?",
              },
            ],
          },
        ],
      });

      try {
        const result = await chat.sendMessage(userPrompt);
        const response = result.response;

        let reply = response.text();

        // Split long messages into chunks of 1500 characters
        const chunkSize = 1500;
        for (let i = 0; i < reply.length; i += chunkSize) {
          const chunk = reply.slice(i, i + chunkSize);
          await message.channel.send(chunk);
        }
      } catch (error) {
        console.error("Error in chat:", error);
        message.channel.send(
          "Ugh, something went wrong. Can we try that again? I'm too tired to figure out what happened."
        );
      }
    }

    runChat().catch(console.error);
  }
});

// Global error handler
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error.message);
});

// Login to Discord
client.login(process.env.TOKEN);

// Function to recursively search for video files
function getVideoFiles(directory) {
  const resolvedPath = path.resolve(directory);
  let videoFiles = [];

  function searchDirectory(dir, prefix = "") {
    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        searchDirectory(filePath, prefix + file + "/");
      } else if (file.endsWith(".mp4") || file.endsWith(".mkv")) {
        videoFiles.push(prefix + file);
      }
    });
  }

  searchDirectory(resolvedPath);
  return videoFiles;
}

// Set up Express app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// CORS configuration
app.use(
  cors({
    origin: [
      `http://${STATIC_IP}`,
      `http://${STATIC_IP}:${PORT}`,
      `http://localhost:${PORT}`,
      `http://[::]:${PORT}`,
      `http://localhost:${PORT}`,
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

let activeStream = null;
let viewerCount = 0;
let interactedSockets = new Set(); // Changed to Set to store active socket IDs
let allUsersInteracted = false;

// Serve static files
app.use(express.static("public"));

// Serve video player page
app.get("/player", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "player.html"));
});

// Video streaming route
app.get("/video/:filename", (req, res) => {
  const filePath = path.join(process.env.VIDEO_DIRECTORY, req.params.filename);
  console.log("Requested video file path:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  viewerCount++;

  // Pause video for everyone if it was playing
  if (videoState.isPlaying) {
    videoState.isPaused = true;
    videoState.isPlaying = false;
    io.emit("control", { action: "pause" });
    io.emit("waitForInteraction", { newViewer: true });
  }

  // Send current video state to new connections
  socket.emit("videoStateUpdate", videoState);

  updateViewerCounts();

  socket.on("disconnect", () => {
    viewerCount--;
    interactedSockets.delete(socket.id);
    updateViewerCounts();

    // Pause video if someone leaves while watching
    if (videoState.isPlaying) {
      videoState.isPaused = true;
      videoState.isPlaying = false;
      io.emit("control", { action: "pause" });
      io.emit("waitForInteraction", { viewerLeft: true });
    }
  });

  socket.on("userInteraction", () => {
    interactedSockets.add(socket.id);
    updateViewerCounts();
    console.log("User interaction received from socket:", socket.id);

    // If all users have interacted and video was paused due to new viewer, resume playback
    if (allUsersInteracted && videoState.isPaused) {
      videoState.isPaused = false;
      videoState.isPlaying = true;
      io.emit("control", { action: "play" });
    }
  });

  socket.on("control", (data) => {
    try {
      if (data.action === "play" || data.action === "pause") {
        videoState.isPlaying = data.action === "play";
        videoState.currentTime = data.currentTime;
        videoState.lastUpdateTime = Date.now();
        io.emit("videoStateUpdate", videoState);
      } else if (data.action === "seek") {
        videoState.currentTime = data.time;
        videoState.lastUpdateTime = Date.now();
        io.emit("videoStateUpdate", videoState);
      }
      console.log("Video state updated:", videoState);
    } catch (error) {
      console.error("Error handling control event:", error);
    }
  });
});

// Function to update viewer counts
function updateViewerCounts() {
  interactedSockets = new Set(
    [...interactedSockets].filter((id) => io.sockets.sockets.has(id))
  );

  const interactedViewers = interactedSockets.size;
  allUsersInteracted = interactedViewers === viewerCount && viewerCount > 0;

  console.log("Updating viewer counts:", {
    totalViewers: viewerCount,
    interactedViewers: interactedViewers,
    allUsersInteracted: allUsersInteracted,
    interactedSockets: Array.from(interactedSockets),
  });

  io.emit("viewerCount", {
    totalViewers: viewerCount,
    interactedViewers: interactedViewers,
    allUsersInteracted: allUsersInteracted,
  });

  // If all users have interacted and video was paused due to new viewer, resume playback
  if (allUsersInteracted && videoState.isPaused) {
    videoState.isPaused = false;
    videoState.isPlaying = true;
    io.emit("control", { action: "play" });
  }
}

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://${STATIC_IP}:${PORT}`);
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url} from ${req.ip}`);
  next();
});
