const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const config = fs.readFileSync(path.join(root, "config.js"), "utf8");
const javascript = fs.readFileSync(path.join(root, "game.js"), "utf8");

const standalone = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n  </style>`)
  .replace('<script src="config.js"></script>', `<script>\n${config.split("</script").join("<\\/script")}\n  </script>`)
  .replace('<script src="game.js" defer></script>', `<script>\n${javascript.split("</script").join("<\\/script")}\n  </script>`);

fs.writeFileSync(path.join(root, "standalone-index.html"), standalone);
console.log("Created standalone-index.html");
