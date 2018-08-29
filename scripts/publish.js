const fs = require("fs");
const path = require("path");

function resolveCwd(...args) {
  args.unshift(process.cwd());
  return path.join(...args);
}

if (fs.existsSync(resolveCwd("./dist/"))) {
  const ghPages = require("gh-pages");
  ghPages.publish(
    resolveCwd("dist"),
    {
      depth: 1,
      logger(message) {
        console.log(message);
      }
    },
    () => {
      console.log("gh-paged");
    }
  );
}
