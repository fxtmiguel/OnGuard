const express = require("express");
const cors = require("cors");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const axios = require('axios');
const FormData = require('form-data');
const LOG_FILE = path.resolve(__dirname, "file_logs.log");

const VT_API_KEY = 'fa573ac24c752bb9f43774392b23f8cb52d2abe84490feb806eb2c656c96f043';

function processLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {}
  return [];
}

function saveLogEntry(logEntry) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logEntries, null, 2), 'utf-8');
  } catch (err) {}
}

async function scanFileWithVirusTotal(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('file', fileBuffer, path.basename(filePath));
    const response = await axios.post(
      'https://www.virustotal.com/api/v3/files',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-apikey': VT_API_KEY,
        },
      }
    );
    const analysisId = response.data.data.id;
    await delay(10000);
    const result = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      { headers: { 'x-apikey': VT_API_KEY } }
    );
    const stats = result.data.data.attributes.stats;
    if (stats.malicious > 0 || stats.suspicious > 0) {
      return 'malicious';
    }
    return 'clean';
  } catch (err) {
    return 'unknown';
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const folderToWatch = path.resolve("C:/users/migue/testfolder");

const trackedFiles = {};
let logEntries = [];
fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
let historyLogs = [];

const filesAutoDeleted = new Set();

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
    let malwareScanResult = 'unknown';

    if (!DO_NOT_TOUCH.includes(filename) && riskLevel !== 'high') {
      malwareScanResult = await scanFileWithVirusTotal(fullPath);
    }

    if (!trackedFiles[fullPath]) {
      trackedFiles[fullPath] = "added";

      const entry = {
        type: "add",
        path: fullPath,
        time: new Date(),
        risk: malwareScanResult === 'malicious' ? 'high' : riskLevel,
        malware: malwareScanResult
      };

      logEntries.push(entry);
      historyLogs.push(entry);


      
      saveLogEntry(logEntries);

      if ((riskLevel === "high" || malwareScanResult === "malicious") && !DO_NOT_TOUCH.includes(filename)) {
        try {
          fs.unlinkSync(fullPath);
          filesAutoDeleted.add(fullPath);
          const delEntry = {
            type: "delete",
            path: fullPath,
            time: new Date(),
            risk: riskLevel === "high" ? "high (auto-deleted)" : "malware (auto-deleted)",
          };
          logEntries.push(delEntry);
          historyLogs.push(delEntry);
        } catch (err) {}
      }
    }
  })
  .on("change", async (changedPath) => {
    const fullPath = path.resolve(changedPath);
    const updatedRisk = await assessFileRisk(fullPath);

    if (trackedFiles[fullPath] !== "added") {
      trackedFiles[fullPath] = "changed";

      const entry = {
        type: "change",
        path: fullPath,
        time: new Date(),
        risk: updatedRisk
      };

      logEntries.push(entry);
      historyLogs.push(entry);
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

    const entry = {
      type: "delete",
      path: fullPath,
      time: new Date(),
      risk: riskSnapshot
    };

    logEntries.push(entry);
    historyLogs.push(entry);
  });

app.get("/api/logs", (req, res) => {
  res.json(logEntries.slice(-20));
});

app.get("/api/logs/history", (req, res) => {
  res.json({ history: historyLogs });
});

app.listen(PORT, () => {
  console.log(`Monitoring active on http://localhost:${PORT}`);
});
