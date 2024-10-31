# Discord Music and Video Streaming with AI Chat Bot 

This project is a Discord bot built with **Discord.js** and **DisTube**, designed for playing music from YouTube, Spotify, and SoundCloud, and supporting video streaming for users via a synchronized web player. 

## 🌟 Features

- **Music Playback**: Supports YouTube, Spotify, and SoundCloud.
- **Customizable Commands**: Play, stop, skip, queue, disconnect, and more.
- **Video Streaming**: Stream local video files to Discord users via a web interface.
- **Laid-back Personality**: Enjoy interacting with "Ellen," the sarcastic and lazy bot with witty replies (inspired by Ellen from *Zenless Zone Zero*).

## 🛠️ Installation

1. Create and edit the `docker-compose.yml` file to configure the environment:

    ```bash
    nano docker-compose.yml
    ```

    `docker-compose.yml`:

    ```yaml
    version: '3'
    services:
      pteropal:
        image: nubsuki/ellen
        container_name: ellen
        ports:
         - 8084:8084 # Your port
        environment:
         - TOKEN= # your discord bot token
         - SPOTIFY_CLIENT_ID= # your spotify client id
         - SPOTIFY_CLIENT_SECRET= # your spotify client secret
         - PORT=8084 # Your port
         - STATIC_IP= # your static ip
         - GOOGLE_AI_API_KEY= # your_api_key_here
         - VIDEO_DIRECTORY= /usr/src/app/videos
         - COMMAND_PREFIX= #your.command.prefix if you haven setup default will be used "."
        volumes:
         - /path/to/videos:/usr/src/app/videos
        restart: unless-stopped
    ```
2. Start the bot:

    ```bash
    docker-compose up -d
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

## 🌐 Web Interface

The bot also provides a web interface for video streaming. After running the bot, you can access the player by navigating to:

```
http://[STATIC_IP]:[PORT]/player
```

The bot will provide the specific link in chat. Make sure all viewers press the **click to join** button to synchronize.

**Want to test the bot?** Feel free to join, test, and leave anytime! [Discord](https://discord.gg/4tjzMpHxKY)

## 📝 License

This project is for personal use and is distributed "as-is".

