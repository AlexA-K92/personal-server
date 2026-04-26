import { ChangeEvent, useState } from "react";
import { FileLock2, Upload } from "lucide-react";

type LocalFile = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
};

export function VaultPage() {
  const [files, setFiles] = useState<LocalFile[]>([]);

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    const newFiles = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
    }));

    setFiles((current) => [...newFiles, ...current]);

    // Allows uploading the same file again if needed.
    event.target.value = "";
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Encrypted Vault</h1>
          <p>Upload, manage, and later encrypt your private files.</p>
        </div>

        <label className="upload-button">
          <Upload size={18} />
          Upload file
          <input type="file" multiple onChange={handleFileUpload} hidden />
        </label>
      </div>

      <div className="panel">
        {files.length === 0 ? (
          <div className="empty-state">
            <FileLock2 size={40} />
            <h2>No files yet</h2>
            <p>Your uploaded files will appear here.</p>
          </div>
        ) : (
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Uploaded</th>
              </tr>
            </thead>

            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>{file.name}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td>{new Date(file.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(1)} ${units[index]}`;
}