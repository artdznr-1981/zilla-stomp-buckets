# 🦖 Zilla-Stomp-Buckets

**Can Godzilla Destroy an S3 Bucket?**

A high-energy, sci-fi whack-a-mole game where Godzilla attempts to destroy AWS S3 storage buckets. Spoiler: S3's durability and replication make it nearly impossible!

## 🎮 Game Features

- **4 Epic Rounds**: Physical Stomp, Atomic Breath, Sneak Attack, and Object Lock
- **Multiple Endings**: Bronze, Silver, Gold, and Secret endings based on performance
- **Combo System**: Chain hits for massive score multipliers
- **Educational**: Learn about S3's durability, replication, versioning, and compliance features
- **Responsive**: Works on desktop and mobile devices with touch support

## 🚀 Quick Start

### Play Locally

1. Clone this repository
2. Open `index.html` in your web browser
3. Start stomping buckets!

### Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings > Pages
3. Select "main" branch as source
4. Your game will be live at `https://yourusername.github.io/Zilla-Stomp-Buckets`

## 🛠️ Development

### Project Structure

```
Zilla-Stomp-Buckets/
├── index.html          # Main game page
├── styles.css          # Game styling
├── game.js             # Game logic
├── build_assets.py     # Python asset optimizer
├── assets/             # Game assets
│   ├── images/         # Game images
│   └── sounds/         # Sound effects
└── README.md           # This file
```

### Adding Assets

Run the Python build script to set up asset directories:

```bash
python build_assets.py
```

Then add your images and sounds to the respective folders.

## 🎯 Gameplay

- **Objective**: Click/tap S3 buckets as they appear
- **Scoring**: 100 points per hit, multiplied by combo
- **Rounds**: Each round increases difficulty with more buckets and faster spawns
- **Endings**: 
  - Bronze (0-50%): Godzilla Retreats
  - Silver (51-80%): Stalemate
  - Gold (81-95%): Godzilla's Rampage
  - Secret (96-100%): The Impossible

## 📚 Educational Content

Learn about AWS S3 features:
- **Multi-AZ Replication**: Data replicated across 3+ Availability Zones
- **11 Nines Durability**: 99.999999999% durability
- **Object Versioning**: Protect against accidental deletion
- **Object Lock**: Compliance-mode immutability

## 🔧 Technologies

- HTML5 Canvas for graphics
- Vanilla JavaScript (no dependencies!)
- CSS3 for UI
- Python for build tools
- LocalStorage for high scores

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new rounds or features
- Improve graphics and animations
- Add sound effects
- Enhance mobile experience

## 🎨 Credits

Game concept inspired by AWS S3's incredible durability and Godzilla's unstoppable force meeting an immovable object.

---

**Made with ❤️ for cloud enthusiasts and Kaiju fans**
