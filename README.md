# Blinker

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/up9t99)

<p align="center">
  <img width="128" height="128" alt="icon" src="./icon.svg" />
</p>

<p align="center">
 <img src="https://github.com/up9t/blinker/actions/workflows/build.yaml/badge.svg" />
</p>

Too focused doing your job and forget to blink? that's bad for your eyes, fortunately this application just do the right thing for you.

## Screenshot

![screenshot 1](./docs/images/screenshot1.png)
![screenshot 2](./docs/images/breakpoint.png)

## Features

- Blink detector
- Camera selection
- Timeout customization
- Multiple breakpoints
- Breakpoint customization


## Todo 

- If the user doesn’t have camera, it should have another method for reminding the user to blink, such as interval timer

## Downloads

Downloads are available in AppImage, RPM/DEB, Flatpak and even Tarball. 

- [Go to download page](https://github.com/up9t/blinker/releases)

## Development

### Install dependencies

- Install Rust & Cargo

- Install Node & Npm

- Install Node dependencies:

    ```bash
    $ npm ci
    ```

### Run dev server

```bash
npm run dev

# or
npm run tauri dev
```

### Build

```bash 
npm run tauri build
```

Build binary only

```bash
npm run tauri build -- --no-bundle
```

Build flatpak and run flatpak (manually)

```bash
npm ci 
npm run tauri build -- --no-bundle
flatpak-builder --repo=repo --force-clean build-dir/ org.blinker.Blinker.yaml
flatpak --user install ./repo org.blinker.Blinker -y
flatpak run org.blinker.Blinker
```

## Developer Notes

- To automatically build the icons from a specific file:

    ```bash
    npm run tauri icon icon.svg
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
