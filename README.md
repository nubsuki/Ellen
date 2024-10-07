# Discord Music and Video Streaming with AI Chat Bot 

This project is a Discord bot built with **Discord.js** and **DisTube**, designed for playing music from YouTube, Spotify, and SoundCloud, and supporting video streaming for users via a synchronized web player. 

## 🌟 Features

- **Music Playback**: Supports YouTube, Spotify, and SoundCloud.
- **Customizable Commands**: Play, stop, skip, queue, disconnect, and more.
- **Video Streaming**: Stream local video files to Discord users via a web interface.
- **Laid-back Personality**: Enjoy interacting with "Ellen," the sarcastic and lazy bot with witty replies (inspired by Ellen from *Zenless Zone Zero*).

## 🛠️ Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/nubsuki/Ellen.git
   cd Ellen
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   You can also run the bot on Docker. Most of the configuration is already set up for you. Make sure you run all the dependencies and ensure you have `ffmpeg` installed.

   - Get `ffmpeg-git-full.7z`: [Download here](https://www.gyan.dev/ffmpeg/builds/)
   - Get the version that contains `bin`: `ffmpeg-git-full.7z`

   Set up `ffmpeg`:

   ```bash
   # Copy ffmpeg to a directory, e.g., C:\ffmpeg
   # Go to > View Advanced System Settings > Environment Variables
   # Under System Variables, find "Path", click "Edit", then "New" and add C:\ffmpeg\bin

   # Check installation by running:
   ffmpeg
   ```

   If you're running this on Docker, you can skip the above step—`ffmpeg` is already included in the Docker setup. If using `docker-compose.yml`, specify the image:

   ```yaml
   image: nubsuki/ellen:latest
   ```

3. **Set up environment variables**: Create a `.env` file in the root directory with the following configuration:

   ```bash
   TOKEN=your_discord_token
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VIDEO_DIRECTORY=path_to_video_directory
   STATIC_IP=your_static_ip_address
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

   - Create your bot: [Discord Developer Portal](https://discord.com/developers/applications)
   - Get Google AI API Key: [Google AI API Key](https://ai.google.dev/gemini-api/docs/api-key)
   - Get Spotify API Key: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

   **Example**:
   
   - For `VIDEO_DIRECTORY`: use `C:\Movies`
   - No quotes around tokens; format should be `TOKEN=your_token`.

4. **Run the bot**:

   ```bash
   node index.js
   ```

## ⚙️ Usage

### Music Commands:
- `.play [song]`: Plays the requested song.
- `.stop`: Stops the current music.
- `.skip`: Skips to the next song.
- `.queue`: Shows the current song queue.
- `.dc`: Disconnects the bot from the voice channel.

### Video Commands:
- `.search`: Search for available videos.
- `.stream [file_number]`: Starts streaming a video from the file list.
- `.pvideo`: Play the current video.
- `.svideo`: Pause the current video.
- `.rvideo`: Resume the current video.
- `.clear`: Clears the current video stream.

### Chat AI Interaction:
- `.ellen [message]`: Ask the bot for some sarcastic help, powered by Google AI. 

## 📂 File Structure

```
.
├── public             # Static files for the web player
├── src                # Core bot source code
├── .env               # Environment configuration
└── README.md          # Project documentation
```

## 🌐 Web Interface

The bot also provides a web interface for video streaming. After running the bot, you can access the player by navigating to:

```
http://[STATIC_IP]:[PORT]/player
```

The bot will provide the specific link in chat. Make sure all viewers press the **click to join** button to synchronize.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

