# Blinker

<p align="center">
  <img width="128" height="128" alt="icon" src="./build/icon.png" />
</p>

<p align="center">
 <img src="https://github.com/ilyasa1211/blinker/actions/workflows/build.yaml/badge.svg" />
</p>

Too focused doing your job and forget to blink? that's bad for your eyes, fortunately this application just do the right thing for you.

## Screenshot

![screenshot 1](./docs/images/main.png)
![screenshot 2](./docs/images/breakpoint.png)

## Features

- Blink detector
- Camera selection
- Timeout customization
- Multiple breakpoints
- Breakpoint customization


## Todo 

- If the user doesn’t have camera, it should have another method for reminding the user to blink, such as interval timer

## Developer Note

Devcontainer doesn't really work,
if you want to develop inside a container, you need to compile them everytime you want to see the change.

```bash
# Inside a devcontainer
npm run build:unpack
# Switch to your host terminal
./dist/linux-unpacked/blinker
```

```bash
# Or you could also try on browser, inside the devcontainer run this command: 
npm run dev -- --noSandbox
# Then go to your browser's http://localhost:5173
# Make sure you've forward the port 5173 in the devcontainer
```

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## FAQ

### What’s the purpose?

This app is designed for people that looking at laptop or desktop for a long time, it help their eyes relax, and preventing or slowing the process of more nearsightedness. Blinking is good for eye’s health, but when we are too focus to do our jobs, we sometimes forget to blink, it sometimes also causes some headache if we’re focused for too long.

### Who are the targets?

Mainly for developers, but also for people that doing their job in front of computer.

### What are the platforms?

Mainly for desktop, it could be 

- Linux,
- Windows and
- macOS,

Again, I’m trying to help people that has the same problem as many as possible.

### What would the final product be?

Free to use for everyone and open source, transparent, and any developers could contribute for the project.
