const express = require("express");
const cors = require("cors");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const folderToWatch = path.resolve("C:/users/migue/testfolder");

const trackedFiles = {};
let logEntries = [];

const filesAutoDeleted = new Set(); // Keeping track of files we auto-removed (just in case)

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const DO_NOT_TOUCH = ["donotdelete.txt", "important.docx", "CLASSIFIED.txt"];

async function assessFileRisk(filePath) {
  const flaggedExts = [".locked", ".encrypted", ".enc", ".crypt", ".ransom"];
  const fileName = path.basename(filePath).toLowerCase();

  if (flaggedExts.some(ext => fileName.endsWith(ext))) {
    await delay(2000); 
    return "high";
  }

  if (fileName.includes("decrypt") || fileName.includes("recover")) {
    return "medium";
  }

  return "low"; 
}

const watcher = chokidar.watch(folderToWatch, {
  ignored: /^\./,
  persistent: true,
});

watcher
  .on("add", async (addedPath) => {
    const fullPath = path.resolve(addedPath);
    const filename = path.basename(fullPath);


    if (
      filename.startsWith("New Text Document") ||
      filename.startsWith("New Rich Text Document")
    ) return;

    const riskLevel = await assessFileRisk(fullPath);

    if (!trackedFiles[fullPath]) {
      trackedFiles[fullPath] = "added";

      logEntries.push({
        type: "add",
        path: fullPath,
        time: new Date(),
        risk: riskLevel
      });

     
      if (riskLevel === "high" && !DO_NOT_TOUCH.includes(filename)) {
        try {
          fs.unlinkSync(fullPath);
          filesAutoDeleted.add(fullPath); 
          console.log(`⚠️ High-risk file deleted: ${filename}`);

          logEntries.push({
            type: "delete",
            path: fullPath,
            time: new Date(),
            risk: "high (auto-deleted)",
          });
        } catch (err) {
          console.error(`Delete failed: ${err.message}`);
        }
      }
    }
  })

  .on("change", async (changedPath) => {
    const fullPath = path.resolve(changedPath);
    const updatedRisk = await assessFileRisk(fullPath);

    if (trackedFiles[fullPath] !== "added") {
      trackedFiles[fullPath] = "changed";

      logEntries.push({
        type: "change",
        path: fullPath,
        time: new Date(),
        risk: updatedRisk
      });
    }
  })

  .on("unlink", async (removedPath) => {
    const fullPath = path.resolve(removedPath);
    const filename = path.basename(fullPath);

  
    if (
      filename.startsWith("New Text Document") ||
      filename.startsWith("New Rich Text Document")
    ) return;

    if (filesAutoDeleted.has(fullPath)) {
      filesAutoDeleted.delete(fullPath);
      return;
    }

    const riskSnapshot = await assessFileRisk(fullPath);
    trackedFiles[fullPath] = "deleted";

    logEntries.push({
      type: "delete",
      path: fullPath,
      time: new Date(),
      risk: riskSnapshot
    });
  });

app.get("/api/logs", (req, res) => {
  res.json(logEntries.slice(-20));
});

app.listen(PORT, () => {
  console.log(`✅ Monitoring active on http://localhost:${PORT}`);
});
