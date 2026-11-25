(() => {
  "use strict";
  const textEncoder = new TextEncoder();
  const strictUtf8Decoder = new TextDecoder("utf-8", { fatal: true });
  const fileTimeEpochOffsetMilliseconds = 11644473600000n;
  const maximumDateMilliseconds = 8640000000000000;
  const encodeText = text => textEncoder.encode(text);
  const bytesToBinaryString = bytes => {
    let binaryString = "";
    for (let offset = 0; offset < bytes.length; offset += 32768) binaryString += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return binaryString;
  };
  const binaryStringToBytes = binaryString => Uint8Array.from(binaryString, character => character.charCodeAt(0));
  const bytesToBase64 = bytes => btoa(bytesToBinaryString(bytes));
  const base64ToBytes = input => {
    const cleaned = input.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) throw new Error("This is not valid Base64. Allowed characters are A to Z, a to z, 0 to 9, + and / with optional = padding at the end.");
    const unpadded = cleaned.replace(/=+$/, "");
    if (unpadded.length % 4 === 1) throw new Error("This is not valid Base64: the length is wrong, a character is probably missing or extra.");
    try {
      return binaryStringToBytes(atob(unpadded + "=".repeat((4 - (unpadded.length % 4)) % 4)));
    } catch (error) {
      throw new Error("This is not valid Base64.");
    }
  };
  const bytesToBase64Url = bytes => bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const base64UrlToBytes = input => {
    const cleaned = input.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9_-]*={0,2}$/.test(cleaned)) throw new Error("This is not valid Base64URL. Allowed characters are A to Z, a to z, 0 to 9, - and _.");
    return base64ToBytes(cleaned.replace(/-/g, "+").replace(/_/g, "/"));
  };
  const bytesToHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const hexToBytes = input => {
    const cleaned = input.replace(/0x|\\x/gi, "").replace(/[\s:,-]/g, "");
    if (!/^[0-9a-f]*$/i.test(cleaned)) throw new Error("This is not valid hex. Use the characters 0 to 9 and a to f, optionally separated by spaces or colons.");
    if (cleaned.length % 2 !== 0) throw new Error("Hex needs an even number of digits, two per byte.");
    return Uint8Array.from(cleaned.match(/../g) || [], pair => parseInt(pair, 16));
  };
  const bytesToBinary = bytes => Array.from(bytes, byte => byte.toString(2).padStart(8, "0")).join(" ");
  const binaryToBytes = input => {
    const cleaned = input.replace(/[\s,]/g, "");
    if (!/^[01]*$/.test(cleaned)) throw new Error("Binary may only contain 0 and 1, optionally separated by spaces.");
    if (cleaned.length % 8 !== 0) throw new Error("Binary needs groups of 8 bits per byte.");
    return Uint8Array.from(cleaned.match(/.{8}/g) || [], group => parseInt(group, 2));
  };
  const bytesToText = bytes => {
    try {
      return { text: strictUtf8Decoder.decode(bytes), notice: "" };
    } catch (error) {
      return { text: bytesToHex(bytes), notice: "The decoded bytes are not valid UTF-8 text, so they are shown as hex." };
    }
  };
  const htmlEncodeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
  const namedEntities = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", copy: "©", reg: "®", trade: "™", hellip: "…", laquo: "«", raquo: "»", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", euro: "€", pound: "£", yen: "¥", cent: "¢", sect: "§", deg: "°", plusmn: "±", times: "×", divide: "÷", middot: "·", bull: "•", para: "¶", shy: "­" };
  const encodeHtmlEntities = text => text.replace(/[&<>"']/g, character => htmlEncodeMap[character]);
  const decodeHtmlEntities = text => text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (match, entityBody) => {
    if (entityBody[0] === "#") {
      const codePoint = entityBody[1] === "x" || entityBody[1] === "X" ? parseInt(entityBody.slice(2), 16) : parseInt(entityBody.slice(1), 10);
      return codePoint > 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff) ? String.fromCodePoint(codePoint) : match;
    }
    return Object.hasOwn(namedEntities, entityBody) ? namedEntities[entityBody] : match;
  });
  const encodeUrl = text => {
    try {
      return encodeURIComponent(text);
    } catch (error) {
      throw new Error("The text contains an unpaired surrogate character and cannot be URL encoded.");
    }
  };
  const decodeUrl = text => {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      throw new Error("Malformed percent encoding: every % must be followed by two hex digits that form valid UTF-8.");
    }
  };
  const codecs = {
    base64: { encode: text => bytesToBase64(encodeText(text)), decode: text => bytesToText(base64ToBytes(text)) },
    base64url: { encode: text => bytesToBase64Url(encodeText(text)), decode: text => bytesToText(base64UrlToBytes(text)) },
    url: { encode: encodeUrl, decode: text => ({ text: decodeUrl(text), notice: "" }) },
    html: { encode: encodeHtmlEntities, decode: text => ({ text: decodeHtmlEntities(text), notice: "" }) },
    hex: { encode: text => bytesToHex(encodeText(text)), decode: text => bytesToText(hexToBytes(text)) },
    binary: { encode: text => bytesToBinary(encodeText(text)), decode: text => bytesToText(binaryToBytes(text)) }
  };
  const runCodec = (format, direction, input) => {
    const codec = codecs[format];
    if (!codec) throw new Error("Unknown format.");
    return direction === "encode" ? { text: codec.encode(input), notice: "" } : codec.decode(input.trim());
  };
  const md5ShiftAmounts = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const md5Constants = Array.from({ length: 64 }, (unused, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 4294967296) >>> 0);
  const rotateLeft = (value, amount) => (value << amount) | (value >>> (32 - amount));
  const md5 = bytes => {
    const messageLength = bytes.length;
    const paddedLength = (Math.floor((messageLength + 8) / 64) + 1) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);
    padded[messageLength] = 0x80;
    const paddedView = new DataView(padded.buffer);
    paddedView.setUint32(paddedLength - 8, (messageLength * 8) >>> 0, true);
    paddedView.setUint32(paddedLength - 4, Math.floor(messageLength / 536870912), true);
    let stateA = 0x67452301;
    let stateB = 0xefcdab89;
    let stateC = 0x98badcfe;
    let stateD = 0x10325476;
    const words = new Uint32Array(16);
    for (let blockOffset = 0; blockOffset < paddedLength; blockOffset += 64) {
      for (let wordIndex = 0; wordIndex < 16; wordIndex += 1) words[wordIndex] = paddedView.getUint32(blockOffset + wordIndex * 4, true);
      let roundA = stateA;
      let roundB = stateB;
      let roundC = stateC;
      let roundD = stateD;
      for (let step = 0; step < 64; step += 1) {
        let mixed;
        let wordIndex;
        if (step < 16) {
          mixed = (roundB & roundC) | (~roundB & roundD);
          wordIndex = step;
        } else if (step < 32) {
          mixed = (roundD & roundB) | (~roundD & roundC);
          wordIndex = (5 * step + 1) % 16;
        } else if (step < 48) {
          mixed = roundB ^ roundC ^ roundD;
          wordIndex = (3 * step + 5) % 16;
        } else {
          mixed = roundC ^ (roundB | ~roundD);
          wordIndex = (7 * step) % 16;
        }
        mixed = (mixed + roundA + md5Constants[step] + words[wordIndex]) >>> 0;
        roundA = roundD;
        roundD = roundC;
        roundC = roundB;
        roundB = (roundB + rotateLeft(mixed, md5ShiftAmounts[step])) >>> 0;
      }
      stateA = (stateA + roundA) >>> 0;
      stateB = (stateB + roundB) >>> 0;
      stateC = (stateC + roundC) >>> 0;
      stateD = (stateD + roundD) >>> 0;
    }
    const digest = new DataView(new ArrayBuffer(16));
    [stateA, stateB, stateC, stateD].forEach((state, index) => digest.setUint32(index * 4, state, true));
    return bytesToHex(new Uint8Array(digest.buffer));
  };
  const shaAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
  const isSubtleCryptoAvailable = () => Boolean(globalThis.crypto && globalThis.crypto.subtle && typeof globalThis.crypto.subtle.digest === "function");
  const computeShaDigests = async bytes => {
    const digests = await Promise.all(shaAlgorithms.map(algorithm => globalThis.crypto.subtle.digest(algorithm, bytes)));
    return Object.fromEntries(shaAlgorithms.map((algorithm, index) => [algorithm, bytesToHex(new Uint8Array(digests[index]))]));
  };
  const johnNote = "No hashcat mode. Use John the Ripper with --format=crypt on a system that supports it.";
  const formatSignatures = [
    { pattern: /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/, name: "bcrypt", mode: 3200 },
    { pattern: /^\$6\$(rounds=\d+\$)?[^$]+\$[./A-Za-z0-9]{86}$/, name: "sha512crypt ($6$, Linux shadow)", mode: 1800 },
    { pattern: /^\$5\$(rounds=\d+\$)?[^$]+\$[./A-Za-z0-9]{43}$/, name: "sha256crypt ($5$)", mode: 7400 },
    { pattern: /^\$1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/, name: "md5crypt ($1$, also Cisco IOS type 5)", mode: 500 },
    { pattern: /^\$apr1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/, name: "Apache apr1 MD5 (htpasswd)", mode: 1600 },
    { pattern: /^\$y\$[^$]+\$[^$]*\$[./A-Za-z0-9]+$/, name: "yescrypt ($y$, default in current Debian, Ubuntu, Kali and Fedora)", note: johnNote },
    { pattern: /^\$gy\$/, name: "gost-yescrypt ($gy$)", note: johnNote },
    { pattern: /^\$7\$/, name: "scrypt ($7$ crypt format)", note: johnNote },
    { pattern: /^\$sha1\$\d+\$/, name: "sha1crypt (NetBSD $sha1$)", mode: 15100 },
    { pattern: /^\$argon2(id|i|d)\$/, name: "Argon2", note: "Memory hard and slow to crack by design. Supported by John the Ripper and recent hashcat releases." },
    { pattern: /^\$krb5tgs\$23\$/i, name: "Kerberos 5 TGS-REP etype 23 (RC4, Kerberoasting)", mode: 13100 },
    { pattern: /^\$krb5tgs\$17\$/i, name: "Kerberos 5 TGS-REP etype 17 (AES128)", mode: 19600 },
    { pattern: /^\$krb5tgs\$18\$/i, name: "Kerberos 5 TGS-REP etype 18 (AES256)", mode: 19700 },
    { pattern: /^\$krb5asrep\$23\$/i, name: "Kerberos 5 AS-REP etype 23 (RC4, AS-REP roasting)", mode: 18200 },
    { pattern: /^\$krb5asrep\$(17|18)\$/i, name: "Kerberos 5 AS-REP with AES", note: "Supported by recent hashcat releases and John the Ripper." },
    { pattern: /^\$krb5pa\$23\$/i, name: "Kerberos 5 AS-REQ pre-auth etype 23", mode: 7500 },
    { pattern: /^\$krb5pa\$17\$/i, name: "Kerberos 5 AS-REQ pre-auth etype 17 (AES128)", mode: 19800 },
    { pattern: /^\$krb5pa\$18\$/i, name: "Kerberos 5 AS-REQ pre-auth etype 18 (AES256)", mode: 19900 },
    { pattern: /^[^:\s]+::[^:]*:[0-9a-f]{16}:[0-9a-f]{32}:[0-9a-f]+$/i, name: "NetNTLMv2 (Responder or ntlmrelayx capture)", mode: 5600 },
    { pattern: /^[^:\s]+::[^:]*:[0-9a-f]{48}:[0-9a-f]{48}:[0-9a-f]{16}$/i, name: "NetNTLMv1", mode: 5500 },
    { pattern: /^\$DCC2\$\d+#[^#]+#[0-9a-f]{32}$/i, name: "Domain Cached Credentials 2 (DCC2, MS Cache v2)", mode: 2100 },
    { pattern: /^[^:]*:\d+:[0-9a-f]{32}:[0-9a-f]{32}:::?$/i, name: "pwdump or secretsdump line (user:RID:LM:NT)", mode: 1000, note: "Crack the fourth field, the NT hash, as NTLM. An LM field of aad3b435b51404eeaad3b435b51404ee means no LM hash is stored." },
    { pattern: /^\$[PH]\$[./A-Za-z0-9]{31}$/, name: "phpass (WordPress, phpBB3, Joomla)", mode: 400 },
    { pattern: /^\$S\$[./A-Za-z0-9]{52}$/, name: "Drupal 7", mode: 7900 },
    { pattern: /^pbkdf2_sha256\$\d+\$/, name: "Django PBKDF2-SHA256", mode: 10000 },
    { pattern: /^\{SSHA\}/i, name: "LDAP SSHA (salted SHA-1)", mode: 111 },
    { pattern: /^\{SHA\}/i, name: "LDAP SHA-1 (Base64)", mode: 101 },
    { pattern: /^\*[0-9a-f]{40}$/i, name: "MySQL 4.1 and later", mode: 300 },
    { pattern: /^\$8\$/, name: "Cisco IOS type 8 (PBKDF2-SHA256)", mode: 9200 },
    { pattern: /^\$9\$/, name: "Cisco IOS type 9 (scrypt)", mode: 9300 },
    { pattern: /^\$ml\$/, name: "macOS 10.8 and later (PBKDF2-SHA512)", mode: 7100 },
    { pattern: /^\$BLAKE2\$[0-9a-f]{128}$/i, name: "BLAKE2b-512", mode: 600 }
  ];
  const hexCandidatesByLength = {
    8: [{ name: "CRC32", mode: 11500, note: "hashcat expects hash:salt, for example c762de4a:00000000." }, { name: "Adler-32" }],
    16: [{ name: "MySQL 3.23 (old PASSWORD function)", mode: 200 }, { name: "Half MD5", mode: 5100 }],
    32: [{ name: "MD5", mode: 0 }, { name: "NTLM", mode: 1000 }, { name: "MD4", mode: 900 }, { name: "LM", mode: 3000, note: "Usually uppercase in dumps." }, { name: "Domain Cached Credentials (DCC, MS Cache)", mode: 1100, note: "hashcat expects hash:username." }],
    40: [{ name: "SHA-1", mode: 100 }, { name: "RIPEMD-160", mode: 6000 }, { name: "MySQL 4.1 and later without the leading *", mode: 300 }],
    56: [{ name: "SHA-224", mode: 1300 }, { name: "SHA3-224", mode: 17300 }],
    64: [{ name: "SHA-256", mode: 1400 }, { name: "SHA3-256", mode: 17400 }, { name: "Keccak-256", mode: 17800 }, { name: "GOST R 34.11-2012 (Streebog) 256 bit", mode: 11700 }, { name: "BLAKE2s-256" }],
    96: [{ name: "SHA-384", mode: 10800 }, { name: "SHA3-384", mode: 17500 }],
    128: [{ name: "SHA-512", mode: 1700 }, { name: "SHA3-512", mode: 17600 }, { name: "Keccak-512", mode: 18000 }, { name: "Whirlpool", mode: 6100 }, { name: "BLAKE2b-512", mode: 600, note: "hashcat expects a $BLAKE2$ prefix." }]
  };
  const saltedCandidatesByLength = {
    32: [{ name: "md5($pass.$salt)", mode: 10 }, { name: "md5($salt.$pass)", mode: 20 }, { name: "Domain Cached Credentials (hash:username)", mode: 1100 }],
    40: [{ name: "sha1($pass.$salt)", mode: 110 }, { name: "sha1($salt.$pass)", mode: 120 }],
    64: [{ name: "sha256($pass.$salt)", mode: 1410 }, { name: "sha256($salt.$pass)", mode: 1420 }],
    128: [{ name: "sha512($pass.$salt)", mode: 1710 }, { name: "sha512($salt.$pass)", mode: 1720 }]
  };
  const rawDigestNamesByLength = { 16: "MD5, NTLM or MD4", 20: "SHA-1", 28: "SHA-224", 32: "SHA-256", 48: "SHA-384", 64: "SHA-512" };
  const describeCharacterSet = text => {
    if (/^[0-9a-f]+$/.test(text)) return "lowercase hex";
    if (/^[0-9A-F]+$/.test(text)) return "uppercase hex";
    if (/^[0-9a-f]+$/i.test(text)) return "mixed case hex";
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return "Base64 characters";
    if (/^[./A-Za-z0-9]+$/.test(text)) return "crypt Base64 characters";
    return "mixed characters";
  };
  const identifyHash = input => {
    const hash = input.trim();
    if (!hash) return { summary: "", candidates: [] };
    const summary = "Length " + hash.length + " characters, " + describeCharacterSet(hash) + ".";
    const signatureMatches = formatSignatures.filter(signature => signature.pattern.test(hash)).map(({ name, mode, note }) => ({ name, mode, note }));
    if (signatureMatches.length) return { summary, candidates: signatureMatches };
    if (/^[0-9a-f]+$/i.test(hash)) {
      const candidates = hexCandidatesByLength[hash.length] || [];
      if (candidates.length) return { summary, candidates };
      return { summary, candidates: [], problem: "No common hash type has " + hash.length + " hex characters. Check that the whole hash was copied." };
    }
    const saltedMatch = hash.match(/^([0-9a-f]+):(.+)$/i);
    if (saltedMatch && saltedCandidatesByLength[saltedMatch[1].length]) return { summary, candidates: saltedCandidatesByLength[saltedMatch[1].length].map(candidate => ({ ...candidate, note: "Salted format hash:salt. Many other salted variants exist, check where the hash came from." })) };
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(hash) && hash.length % 4 === 0) {
      const decodedLength = base64ToBytes(hash).length;
      if (rawDigestNamesByLength[decodedLength]) return { summary, candidates: [{ name: "Base64 encoded " + decodedLength + " byte digest (" + rawDigestNamesByLength[decodedLength] + ")", note: "Decode it to hex with the Encode and Decode tool, then identify the hex value." }] };
    }
    if (hash.startsWith("$")) return { summary, candidates: [], problem: "Unknown $" + (hash.split("$")[1] || "") + "$ crypt format. Check the hashcat example hashes page for the prefix." };
    return { summary, candidates: [], problem: "No known hash format matches. Remove extra spaces, quotes or user names around the hash and try again." };
  };
  const formatUtc = date => date.toISOString().replace("T", " ").replace(/\.000Z$/, "Z").replace(/Z$/, " UTC");
  const formatLocal = date => date.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" });
  const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const relativeUnits = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const formatRelative = (milliseconds, nowMilliseconds) => {
    const differenceSeconds = (milliseconds - nowMilliseconds) / 1000;
    if (Math.abs(differenceSeconds) < 1) return "now";
    const [unit, unitSeconds] = relativeUnits.find(([unused, seconds]) => Math.abs(differenceSeconds) >= seconds) || relativeUnits[relativeUnits.length - 1];
    return relativeTimeFormatter.format(Math.round(differenceSeconds / unitSeconds), unit);
  };
  const isRepresentableDate = milliseconds => Number.isFinite(milliseconds) && Math.abs(milliseconds) <= maximumDateMilliseconds;
  const decodeJwtSegment = (segment, segmentName) => {
    let text;
    try {
      text = strictUtf8Decoder.decode(base64UrlToBytes(segment));
    } catch (error) {
      throw new Error("The " + segmentName + " is not valid Base64URL encoded UTF-8.");
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("The " + segmentName + " decodes to text that is not valid JSON.");
    }
  };
  const jwtTimeClaims = [["exp", "Expires (exp)"], ["nbf", "Not before (nbf)"], ["iat", "Issued at (iat)"], ["auth_time", "Authenticated (auth_time)"]];
  const decodeJwt = (input, nowMilliseconds = Date.now()) => {
    const token = input.trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
    const parts = token.split(".");
    if (parts.length === 5) throw new Error("This token has five parts, so it is an encrypted JWE. Its payload cannot be read without the decryption key.");
    if (parts.length !== 3) throw new Error("A JWT has three parts separated by dots: header.payload.signature. This input has " + parts.length + ".");
    const header = decodeJwtSegment(parts[0], "header");
    const payload = decodeJwtSegment(parts[1], "payload");
    if (!header || typeof header !== "object" || Array.isArray(header)) throw new Error("The header must be a JSON object.");
    const rows = [["Algorithm", String(header.alg ?? "not set")], ["Type", String(header.typ ?? "not set")]];
    if (header.kid !== undefined) rows.push(["Key ID", String(header.kid)]);
    const warnings = [];
    if (String(header.alg).toLowerCase() === "none") warnings.push("The algorithm is none: this token is unsigned and must never be accepted.");
    const isObjectPayload = payload && typeof payload === "object" && !Array.isArray(payload);
    let status = "No exp claim, the token does not expire by itself.";
    let statusKind = "warning";
    if (isObjectPayload) {
      jwtTimeClaims.forEach(([claimName, label]) => {
        if (payload[claimName] === undefined) return;
        const claimMilliseconds = Number(payload[claimName]) * 1000;
        if (typeof payload[claimName] !== "number" || !isRepresentableDate(claimMilliseconds)) {
          rows.push([label, "Invalid value " + JSON.stringify(payload[claimName]) + ", expected seconds since the Unix epoch"]);
          return;
        }
        rows.push([label, formatUtc(new Date(claimMilliseconds)) + " (" + formatRelative(claimMilliseconds, nowMilliseconds) + ")"]);
      });
      if (typeof payload.exp === "number") {
        const isExpired = payload.exp * 1000 <= nowMilliseconds;
        status = isExpired ? "Expired " + formatRelative(payload.exp * 1000, nowMilliseconds) + "." : "Not expired. Expires " + formatRelative(payload.exp * 1000, nowMilliseconds) + ".";
        statusKind = isExpired ? "error" : "success";
      }
      if (typeof payload.nbf === "number" && payload.nbf * 1000 > nowMilliseconds) {
        status += " Not valid yet: nbf is " + formatRelative(payload.nbf * 1000, nowMilliseconds) + ".";
        statusKind = "error";
      }
      ["iss", "sub", "aud"].forEach(claimName => {
        if (payload[claimName] !== undefined) rows.push([{ iss: "Issuer (iss)", sub: "Subject (sub)", aud: "Audience (aud)" }[claimName], Array.isArray(payload[claimName]) ? payload[claimName].join(", ") : String(payload[claimName])]);
      });
    } else {
      status = "The payload is valid JSON but not an object, so there are no claims to check.";
    }
    let signatureLength = 0;
    try {
      signatureLength = base64UrlToBytes(parts[2]).length;
    } catch (error) {
      warnings.push("The signature is not valid Base64URL.");
    }
    rows.push(["Signature", parts[2] ? signatureLength + " bytes, NOT verified" : "Empty, the token is unsigned"]);
    rows.push(["Status", status]);
    return { header, payload, rows, status, statusKind, warnings };
  };
  const parseIpv4 = text => {
    const match = text.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!match) return null;
    const octets = match.slice(1).map(Number);
    if (octets.some(octet => octet > 255)) return null;
    return octets.reduce((value, octet) => value * 256 + octet, 0);
  };
  const formatIpv4 = value => [24, 16, 8, 0].map(shift => (value >>> shift) & 255).join(".");
  const prefixToMask = prefix => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
  const maskToPrefix = mask => {
    let prefix = 0;
    while (prefix < 32 && ((mask >>> (31 - prefix)) & 1) === 1) prefix += 1;
    return prefixToMask(prefix) === mask ? prefix : -1;
  };
  const parseMask = text => {
    const cleaned = text.trim().replace(/^\//, "");
    if (/^\d{1,2}$/.test(cleaned)) {
      const prefix = Number(cleaned);
      if (prefix > 32) throw new Error("The prefix length must be between 0 and 32.");
      return { prefix, notice: "" };
    }
    const mask = parseIpv4(cleaned);
    if (mask === null) throw new Error("\"" + text.trim() + "\" is not a valid netmask or prefix. Use 255.255.255.0 or 24.");
    const prefix = maskToPrefix(mask);
    if (prefix >= 0) return { prefix, notice: "" };
    const wildcardPrefix = maskToPrefix((~mask) >>> 0);
    if (wildcardPrefix >= 0) return { prefix: wildcardPrefix, notice: "This looks like a wildcard mask, so it was read as netmask " + formatIpv4(prefixToMask(wildcardPrefix)) + "." };
    throw new Error("The netmask " + text.trim() + " is not contiguous. A valid netmask is a run of 1 bits followed by 0 bits.");
  };
  const addressRanges = [
    ["255.255.255.255", 32, "Limited broadcast"],
    ["0.0.0.0", 8, "This network (RFC 1122), not routable"],
    ["10.0.0.0", 8, "Private (RFC 1918)"],
    ["100.64.0.0", 10, "Carrier grade NAT shared space (RFC 6598)"],
    ["127.0.0.0", 8, "Loopback (RFC 1122)"],
    ["169.254.0.0", 16, "Link local (RFC 3927)"],
    ["172.16.0.0", 12, "Private (RFC 1918)"],
    ["192.0.0.0", 24, "IETF protocol assignments (RFC 6890)"],
    ["192.0.2.0", 24, "Documentation TEST-NET-1 (RFC 5737)"],
    ["192.168.0.0", 16, "Private (RFC 1918)"],
    ["198.18.0.0", 15, "Benchmarking (RFC 2544)"],
    ["198.51.100.0", 24, "Documentation TEST-NET-2 (RFC 5737)"],
    ["203.0.113.0", 24, "Documentation TEST-NET-3 (RFC 5737)"],
    ["224.0.0.0", 4, "Multicast (RFC 5771)"],
    ["240.0.0.0", 4, "Reserved for future use (RFC 1112)"]
  ].map(([network, prefix, label]) => ({ network: parseIpv4(network), mask: prefixToMask(prefix), label }));
  const classifyIpv4 = address => (addressRanges.find(range => ((address & range.mask) >>> 0) === range.network) || { label: "Public, globally routable" }).label;
  const parseSubnetInput = (addressText, maskText) => {
    const addressInput = addressText.trim();
    const maskInput = maskText.trim();
    if (!addressInput) throw new Error("Enter an IPv4 address such as 10.10.10.0/24.");
    const pieces = addressInput.match(/^([^\s/]+)\s*(?:\/\s*(\S+)|\s+(\S+))?$/);
    if (!pieces) throw new Error("Use CIDR notation such as 10.10.10.0/24, or an address followed by a netmask.");
    const address = parseIpv4(pieces[1]);
    if (address === null) throw new Error("\"" + pieces[1] + "\" is not a valid IPv4 address. Use four numbers from 0 to 255 separated by dots.");
    const embeddedMask = pieces[2] || pieces[3] || "";
    if (embeddedMask && maskInput) throw new Error("Give the prefix in one place only: either in the address field or in the netmask field.");
    const maskSource = embeddedMask || maskInput;
    if (!maskSource) throw new Error("Add a prefix such as /24 or a netmask such as 255.255.255.0.");
    return { address, ...parseMask(maskSource) };
  };
  const calculateSubnet = (address, prefix) => {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (address & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const totalAddresses = 2 ** (32 - prefix);
    let firstHost = network + 1;
    let lastHost = broadcast - 1;
    let usableHosts = totalAddresses - 2;
    if (prefix === 32) {
      firstHost = network;
      lastHost = network;
      usableHosts = 1;
    } else if (prefix === 31) {
      firstHost = network;
      lastHost = broadcast;
      usableHosts = 2;
    }
    return { address, prefix, mask, wildcard, network, broadcast, totalAddresses, firstHost, lastHost, usableHosts, addressType: classifyIpv4(address) };
  };
  const toBinaryOctets = value => [24, 16, 8, 0].map(shift => ((value >>> shift) & 255).toString(2).padStart(8, "0")).join(".");
  const describeSubnet = subnet => {
    const rows = [
      ["Address", formatIpv4(subnet.address)],
      ["CIDR", formatIpv4(subnet.network) + "/" + subnet.prefix],
      ["Network", formatIpv4(subnet.network)],
      ["Broadcast", subnet.prefix >= 31 ? "None (" + (subnet.prefix === 31 ? "point to point link, RFC 3021" : "single host") + ")" : formatIpv4(subnet.broadcast)],
      ["First host", formatIpv4(subnet.firstHost)],
      ["Last host", formatIpv4(subnet.lastHost)],
      ["Usable hosts", subnet.usableHosts.toLocaleString("en-US")],
      ["Total addresses", subnet.totalAddresses.toLocaleString("en-US")],
      ["Netmask", formatIpv4(subnet.mask)],
      ["Wildcard mask", formatIpv4(subnet.wildcard)],
      ["Netmask in binary", toBinaryOctets(subnet.mask)],
      ["Address type", subnet.addressType]
    ];
    return rows;
  };
  const describeDate = (milliseconds, nowMilliseconds = Date.now(), exactFileTime = null) => {
    if (!isRepresentableDate(milliseconds)) throw new Error("This timestamp is outside the range a date can represent (about 275,000 years either side of 1970).");
    const date = new Date(milliseconds);
    const fileTime = exactFileTime ?? (BigInt(Math.round(milliseconds)) + fileTimeEpochOffsetMilliseconds) * 10000n;
    const unixSeconds = milliseconds / 1000;
    return [
      ["Unix seconds", Number.isInteger(unixSeconds) ? String(unixSeconds) : unixSeconds.toFixed(3)],
      ["Unix milliseconds", String(Math.round(milliseconds))],
      ["Windows FILETIME", fileTime >= 0n ? fileTime.toString() : "Not representable, the date is before 1601"],
      ["FILETIME hex", fileTime >= 0n ? "0x" + fileTime.toString(16).toUpperCase().padStart(16, "0") : "Not representable"],
      ["ISO 8601 (UTC)", date.toISOString()],
      ["UTC", formatUtc(date)],
      ["Local time", formatLocal(date)],
      ["Relative", formatRelative(milliseconds, nowMilliseconds)]
    ];
  };
  const parseTimestamp = (valueText, type) => {
    const cleaned = valueText.trim().replace(/[\s_,]/g, "");
    if (!cleaned) throw new Error("Enter a timestamp, or press Now.");
    const isHex = /^0x[0-9a-f]+$/i.test(cleaned);
    const isNumber = /^-?\d+(\.\d+)?$/.test(cleaned);
    if (!isHex && !isNumber) throw new Error("A timestamp is a number such as 1795703400. FILETIME values may also be written as hex starting with 0x.");
    let resolvedType = type;
    if (type === "auto") {
      const magnitude = isHex ? Infinity : Math.abs(Number(cleaned));
      resolvedType = magnitude >= 1e16 ? "filetime" : magnitude >= 1e11 ? "milliseconds" : "seconds";
    }
    if (isHex && resolvedType !== "filetime") throw new Error("Hex input is only supported for Windows FILETIME.");
    if (resolvedType === "filetime") {
      if (!isHex && !/^\d+$/.test(cleaned)) throw new Error("A FILETIME is a whole, positive number of 100 nanosecond intervals.");
      const fileTime = BigInt(cleaned);
      return { milliseconds: Number(fileTime / 10000n - fileTimeEpochOffsetMilliseconds), fileTime, resolvedType };
    }
    const numericValue = Number(cleaned);
    return { milliseconds: resolvedType === "seconds" ? Math.round(numericValue * 1000) : Math.round(numericValue), fileTime: null, resolvedType };
  };
  const timestampTypeLabels = { seconds: "Unix seconds", milliseconds: "Unix milliseconds", filetime: "Windows FILETIME" };
  const parseDateText = (text, zone) => {
    const match = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?\s*(Z|UTC|GMT|[+-]\d{2}:?\d{2})?$/i);
    if (!match) throw new Error("Use ISO 8601 such as 2026-11-26, 2026-11-26 14:30 or 2026-11-26T14:30:00+02:00.");
    const [year, month, day, hour, minute, second] = match.slice(1, 7).map(part => Number(part || 0));
    const millisecond = Number((match[7] || "").slice(0, 3).padEnd(3, "0"));
    const zoneText = match[8] || "";
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonths[month - 1] || hour > 23 || minute > 59 || second > 59) throw new Error("That date or time does not exist. Check the month, day and time values.");
    const date = new Date(0);
    if (!zoneText && zone === "local") {
      date.setFullYear(year, month - 1, day);
      date.setHours(hour, minute, second, millisecond);
      return date.getTime();
    }
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, millisecond);
    const offsetMatch = zoneText.match(/^([+-])(\d{2}):?(\d{2})$/);
    if (!offsetMatch) return date.getTime();
    if (Number(offsetMatch[2]) > 23 || Number(offsetMatch[3]) > 59) throw new Error("The time zone offset is not valid.");
    const offsetMinutes = (offsetMatch[1] === "-" ? -1 : 1) * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]));
    return date.getTime() - offsetMinutes * 60000;
  };
  if (typeof document === "undefined" || !document.getElementById("encode-decode")) return;
  const rootPath = document.body.dataset.root || "";
  const getElement = identifier => document.getElementById(identifier);
  const showMessage = (element, text, kind = "info") => {
    element.textContent = text;
    element.hidden = !text;
    ["is-error", "is-warning", "is-success"].forEach(className => element.classList.remove(className));
    if (kind !== "info") element.classList.add("is-" + kind);
  };
  const createElementWithText = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  };
  const renderResultList = (listElement, rows) => {
    listElement.replaceChildren(...rows.map(([term, value]) => {
      const row = document.createElement("div");
      row.className = "result-row";
      row.append(createElementWithText("dt", "result-term", term), createElementWithText("dd", "result-value", value));
      return row;
    }));
    listElement.dataset.copyText = rows.map(([term, value]) => term + ": " + value).join("\n");
  };
  const clearOutput = element => {
    if ("value" in element) element.value = "";
    else element.replaceChildren();
    delete element.dataset.copyText;
  };
  const writeToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.className = "copy-helper";
      helper.value = text;
      helper.setAttribute("readonly", "");
      document.body.append(helper);
      helper.select();
      let isCopied = false;
      try {
        isCopied = document.execCommand("copy");
      } catch (fallbackError) {
        isCopied = false;
      }
      helper.remove();
      return isCopied;
    }
  };
  const initializeCopyButtons = () => {
    document.querySelectorAll("[data-copy-target]").forEach(button => {
      const icon = button.querySelector("img");
      let resetTimer = 0;
      button.addEventListener("click", async () => {
        const target = getElement(button.dataset.copyTarget);
        if (!target) return;
        const text = target.dataset.copyText ?? ("value" in target ? target.value : target.textContent);
        if (!text) return;
        const isCopied = await writeToClipboard(text);
        button.title = isCopied ? "Copied" : "Copy failed, select the text and copy it manually";
        if (!isCopied) return;
        button.classList.add("is-copied");
        if (icon) icon.src = rootPath + "Assets/Icon/Check.svg";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          button.classList.remove("is-copied");
          button.title = "Copy";
          if (icon) icon.src = rootPath + "Assets/Icon/Copy.svg";
        }, 1400);
      });
    });
  };
  const initializeCodec = () => {
    const input = getElement("codec-input");
    const output = getElement("codec-output");
    const format = getElement("codec-format");
    const message = getElement("codec-message");
    const run = direction => {
      if (!input.value) {
        output.value = "";
        showMessage(message, "Enter some text to " + direction + " first.", "error");
        return;
      }
      try {
        const result = runCodec(format.value, direction, input.value);
        output.value = result.text;
        showMessage(message, result.notice, result.notice ? "warning" : "info");
      } catch (error) {
        output.value = "";
        showMessage(message, error.message, "error");
      }
    };
    getElement("codec-encode").addEventListener("click", () => run("encode"));
    getElement("codec-decode").addEventListener("click", () => run("decode"));
    getElement("codec-swap").addEventListener("click", () => {
      [input.value, output.value] = [output.value, input.value];
      showMessage(message, "");
      input.focus();
    });
    getElement("codec-clear").addEventListener("click", () => {
      input.value = "";
      output.value = "";
      showMessage(message, "");
      input.focus();
    });
  };
  const initializeHashGenerator = () => {
    const input = getElement("hash-input");
    const message = getElement("hash-message");
    const outputs = { MD5: getElement("hash-output-md5"), "SHA-1": getElement("hash-output-sha-1"), "SHA-256": getElement("hash-output-sha-256"), "SHA-384": getElement("hash-output-sha-384"), "SHA-512": getElement("hash-output-sha-512") };
    let latestRequest = 0;
    const update = async () => {
      const requestNumber = ++latestRequest;
      if (!input.value) {
        Object.values(outputs).forEach(output => { output.value = ""; });
        showMessage(message, "");
        return;
      }
      const bytes = encodeText(input.value);
      outputs.MD5.value = md5(bytes);
      if (!isSubtleCryptoAvailable()) {
        shaAlgorithms.forEach(algorithm => { outputs[algorithm].value = ""; });
        showMessage(message, "SHA hashes need the Web Crypto API (crypto.subtle), which this browser only offers on secure pages. Open the site over https, from localhost or as a local file in a current browser. MD5 still works.", "warning");
        return;
      }
      try {
        const digests = await computeShaDigests(bytes);
        if (requestNumber !== latestRequest) return;
        shaAlgorithms.forEach(algorithm => { outputs[algorithm].value = digests[algorithm]; });
        showMessage(message, "");
      } catch (error) {
        if (requestNumber !== latestRequest) return;
        showMessage(message, "The browser could not calculate the SHA hashes: " + error.message, "error");
      }
    };
    input.addEventListener("input", update);
    getElement("hash-clear").addEventListener("click", () => {
      input.value = "";
      update();
      input.focus();
    });
  };
  const initializeHashIdentifier = () => {
    const form = getElement("identify-form");
    const input = getElement("identify-input");
    const message = getElement("identify-message");
    const output = getElement("identify-output");
    const update = () => {
      clearOutput(output);
      if (!input.value.trim()) {
        showMessage(message, "");
        return;
      }
      const result = identifyHash(input.value);
      showMessage(message, result.problem || "", result.problem ? "error" : "info");
      const summary = createElementWithText("p", "identify-summary", result.summary);
      output.append(summary);
      if (!result.candidates.length) {
        output.dataset.copyText = result.summary;
        return;
      }
      const list = document.createElement("ol");
      list.className = "identify-list";
      result.candidates.forEach(candidate => {
        const item = document.createElement("li");
        item.append(createElementWithText("span", "identify-name", candidate.name));
        if (candidate.mode !== undefined) item.append(" ", createElementWithText("span", "badge", "hashcat -m " + candidate.mode));
        if (candidate.note) item.append(createElementWithText("span", "identify-note", candidate.note));
        list.append(item);
      });
      output.append(list);
      output.dataset.copyText = [result.summary, ...result.candidates.map(candidate => candidate.name + (candidate.mode !== undefined ? " (hashcat -m " + candidate.mode + ")" : "") + (candidate.note ? ": " + candidate.note : ""))].join("\n");
    };
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!input.value.trim()) showMessage(message, "Paste a hash first.", "error");
      else update();
    });
    input.addEventListener("input", update);
    getElement("identify-clear").addEventListener("click", () => {
      input.value = "";
      update();
      input.focus();
    });
  };
  const initializeJwtDecoder = () => {
    const input = getElement("jwt-input");
    const message = getElement("jwt-message");
    const headerOutput = getElement("jwt-header");
    const payloadOutput = getElement("jwt-payload");
    const claimsOutput = getElement("jwt-claims");
    const update = () => {
      [headerOutput, payloadOutput, claimsOutput].forEach(clearOutput);
      if (!input.value.trim()) {
        showMessage(message, "");
        return;
      }
      try {
        const result = decodeJwt(input.value);
        headerOutput.textContent = JSON.stringify(result.header, null, 2);
        payloadOutput.textContent = JSON.stringify(result.payload, null, 2);
        renderResultList(claimsOutput, result.rows);
        const statusText = [...result.warnings, result.status].join(" ");
        showMessage(message, statusText, result.warnings.length ? "error" : result.statusKind);
      } catch (error) {
        showMessage(message, error.message, "error");
      }
    };
    input.addEventListener("input", update);
    getElement("jwt-clear").addEventListener("click", () => {
      input.value = "";
      update();
      input.focus();
    });
  };
  const initializeSubnetCalculator = () => {
    const form = getElement("subnet-form");
    const addressInput = getElement("subnet-address");
    const maskInput = getElement("subnet-mask");
    const message = getElement("subnet-message");
    const output = getElement("subnet-output");
    const update = isExplicit => {
      clearOutput(output);
      if (!addressInput.value.trim() && !maskInput.value.trim() && !isExplicit) {
        showMessage(message, "");
        return;
      }
      try {
        const parsed = parseSubnetInput(addressInput.value, maskInput.value);
        renderResultList(output, describeSubnet(calculateSubnet(parsed.address, parsed.prefix)));
        showMessage(message, parsed.notice, parsed.notice ? "warning" : "info");
      } catch (error) {
        showMessage(message, error.message, "error");
      }
    };
    form.addEventListener("submit", event => {
      event.preventDefault();
      update(true);
    });
    addressInput.addEventListener("input", () => update(false));
    maskInput.addEventListener("input", () => update(false));
    getElement("subnet-clear").addEventListener("click", () => {
      addressInput.value = "";
      maskInput.value = "";
      update(false);
      addressInput.focus();
    });
  };
  const initializeTimestampConverter = () => {
    const timestampForm = getElement("timestamp-form");
    const dateForm = getElement("date-form");
    const valueInput = getElement("timestamp-value");
    const typeSelect = getElement("timestamp-type");
    const dateInput = getElement("date-value");
    const zoneSelect = getElement("date-zone");
    const message = getElement("timestamp-message");
    const output = getElement("timestamp-output");
    const showResult = (rows, note) => {
      renderResultList(output, rows);
      showMessage(message, note);
    };
    const convertTimestamp = () => {
      clearOutput(output);
      try {
        const parsed = parseTimestamp(valueInput.value, typeSelect.value);
        showResult(describeDate(parsed.milliseconds, Date.now(), parsed.fileTime), "Read as " + timestampTypeLabels[parsed.resolvedType] + ".");
      } catch (error) {
        showMessage(message, error.message, "error");
      }
    };
    const convertDate = () => {
      clearOutput(output);
      if (!dateInput.value.trim()) {
        showMessage(message, "Enter a date such as 2026-11-26 14:30:00Z.", "error");
        return;
      }
      try {
        const milliseconds = parseDateText(dateInput.value, zoneSelect.value);
        showResult(describeDate(milliseconds), "Read as " + (/(Z|UTC|GMT|[+-]\d{2}:?\d{2})$/i.test(dateInput.value.trim()) ? "the time zone given in the input" : zoneSelect.value === "local" ? "local time" : "UTC") + ".");
      } catch (error) {
        showMessage(message, error.message, "error");
      }
    };
    timestampForm.addEventListener("submit", event => {
      event.preventDefault();
      convertTimestamp();
    });
    dateForm.addEventListener("submit", event => {
      event.preventDefault();
      convertDate();
    });
    getElement("timestamp-now").addEventListener("click", () => {
      const nowMilliseconds = Date.now();
      const nowValues = { auto: String(Math.floor(nowMilliseconds / 1000)), seconds: String(Math.floor(nowMilliseconds / 1000)), milliseconds: String(nowMilliseconds), filetime: ((BigInt(nowMilliseconds) + fileTimeEpochOffsetMilliseconds) * 10000n).toString() };
      valueInput.value = nowValues[typeSelect.value] || nowValues.auto;
      dateInput.value = new Date(nowMilliseconds).toISOString();
      convertTimestamp();
    });
    getElement("timestamp-clear").addEventListener("click", () => {
      valueInput.value = "";
      dateInput.value = "";
      clearOutput(output);
      showMessage(message, "");
      valueInput.focus();
    });
  };
  initializeCopyButtons();
  initializeCodec();
  initializeHashGenerator();
  initializeHashIdentifier();
  initializeJwtDecoder();
  initializeSubnetCalculator();
  initializeTimestampConverter();
})();
