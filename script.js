function modInverse(a, m) {
  let [m0, x0, x1] = [m, 0, 1];
  a = a % m;
  if (a === 0) return 0;
  while (a > 1) {
    const q = Math.floor(a / m);
    [a, m] = [m, a % m];
    [x0, x1] = [x1 - q * x0, x0];
  }
  return (x1 + m0) % m0;
}

function validateKey(k) {
  const det = (k[0] * k[3] - k[1] * k[2] + 256) % 256;
  const inv = modInverse(det, 256);
  if (det === 0 || inv === 0) {
    throw new Error("Kunci tidak valid (tidak invertible di mod 256)");
  }
  return inv;
}

function process(data, k, mode) {
  let buffer = new Uint8Array(data);
  let result = new Uint8Array(buffer.length);

  if (mode === "decrypt") {
    const det = (k[0] * k[3] - k[1] * k[2] + 256) % 256;
    const inv = modInverse(det, 256);
    k = [
      ( k[3] * inv) % 256,
      (-k[1] * inv + 256) % 256,
      (-k[2] * inv + 256) % 256,
      ( k[0] * inv) % 256
    ];
  }

  for (let i = 0; i < buffer.length; i += 2) {
    const x = buffer[i];
    const y = i + 1 < buffer.length ? buffer[i + 1] : 0;

    result[i] = (k[0] * x + k[1] * y) % 256;
    if (i + 1 < buffer.length) result[i + 1] = (k[2] * x + k[3] * y) % 256;
  }

  return result;
}

function handle(mode) {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const k = ["k0", "k1", "k2", "k3"].map(id => parseInt(document.getElementById(id).value));

  if (!fileInput.files[0] || k.some(x => isNaN(x) || x < 0 || x > 255)) {
    status.innerText = "Masukkan file dan kunci yang valid.";
    return;
  }

  try {
    validateKey(k);

    const reader = new FileReader();
    reader.onload = function (e) {
      const result = process(e.target.result, k, mode);

      const blob = new Blob([result]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (mode === "encrypt" ? "encrypted.bin" : "decrypted.bin");
      a.click();
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
                    }
