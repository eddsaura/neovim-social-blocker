# Block Twitter - Vim Edition

> Learn Vim while fighting social media addiction. One keystroke at a time.

A Chrome extension that blocks Twitter/X until you complete a Vim challenge. Pass the test, unlock Twitter for 24 hours. Fail, and keep practicing those motions.

## Why?

Because scrolling Twitter is easy. Learning Vim is hard. This extension makes the hard thing the gatekeeper to the easy thing.

80 challenges covering everything from basic motions (`hjkl`) to advanced text objects (`ci"`, `da{`), with practical coding scenarios mixed in.

## Features

- **Daily unlock**: Pass a challenge set, get 24 hours of Twitter access
- **80 challenges**: From beginner (`w`, `b`, `dd`) to advanced (`ci"`, `dat`, visual block mode)
- **Real Vim emulation**: Powered by CodeMirror + [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- **Challenge Builder**: Create and share your own challenges
- **Configurable**: Set difficulty, time limits, and challenge categories
- **Custom keymaps**: Upload your `init.vim` to use your own mappings

## Installation

### From source

```bash
# Clone the repo
git clone https://github.com/eddsaura/neovim-social-blocker.git
cd block-twitter-nvim

# Install dependencies
pnpm install

# Build
pnpm build
```

Then load in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## How it works

1. Navigate to twitter.com or x.com
2. Instead of your feed, you'll see a blocking overlay
3. Click "Start Challenge" to begin
4. Complete the Vim challenges before time runs out
5. Success = 24 hours of Twitter access
6. Fail = Try again (and get better at Vim)

## Challenge categories

| Category | Examples |
|----------|----------|
| Basic motions | `h`, `j`, `k`, `l` |
| Word motions | `w`, `b`, `e`, `W`, `B` |
| Line motions | `0`, `^`, `$`, `gg`, `G` |
| Find motions | `f`, `F`, `t`, `T`, `;` |
| Delete | `dd`, `dw`, `d$`, `diw` |
| Change | `cc`, `cw`, `ci"`, `ct)` |
| Yank/Paste | `yy`, `yw`, `p`, `P` |
| Visual mode | `v`, `V`, `Ctrl-v` |
| Text objects | `iw`, `aw`, `i"`, `i(`, `i{` |

## Creating challenges

Use the built-in Challenge Builder (click extension icon → "Challenge Builder") or create JSON files manually:

```json
{
  "id": "delete-word",
  "name": "Delete Word",
  "description": "Delete the word 'old' using 'dw'",
  "type": "editing",
  "category": "delete",
  "difficulty": "easy",
  "tags": ["beginner", "delete"],
  "initial": "const |old value = 42;",
  "expected": "const |value = 42;",
  "hints": ["Use 'dw' to delete from cursor to start of next word"]
}
```

The `|` character marks cursor position. Place challenges in `src/challenges/` and rebuild.

## Configuration

Click the extension icon → Settings to configure:

- **Time limit**: How long you have to complete challenges (default: 60s)
- **Challenge count**: Number of challenges per attempt (default: 5)
- **Difficulty**: Easy, Medium, Hard, or Mixed
- **Categories**: Enable/disable specific challenge types
- **Custom keymaps**: Upload your `init.vim` file

## Tech stack

- React 18 + TypeScript
- [CodeMirror 6](https://codemirror.net/) with [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- Chrome Extension Manifest V3

## Contributing

PRs welcome! Especially for:

- New challenges (the more the merrier)
- Bug fixes
- UI/UX improvements
- Support for other browsers (Firefox, Safari)

## License

MIT

---

Made by [@iamsaura_](https://x.com/iamsaura_)

*P.S. I really enjoy potatoes in all their forms. Mashed, fried, baked, roasted - you name it. This extension was probably built while snacking on some form of potato.*
