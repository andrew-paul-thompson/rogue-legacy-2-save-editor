let saveBuffer = null;
let saveDataView = null;

let goldOffset = null;
let oreOffset = null;
let aetherOffset = null;

document.addEventListener("dragover", (event) => {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});

document.addEventListener("drop", (event) => {
  event.stopPropagation();
  event.preventDefault();

  resetPage();

  try {
    if (event.dataTransfer.files.length === 0) {
      throw new Error("That wasn't a file.");
    }
    let file = event.dataTransfer.files[0];
    processFile(file);
  } catch (e) {
    const errorAlert = document.getElementById("error-alert-container");
    let div = document.createElement("div");
    errorAlert.appendChild(div);

    div.classList.add("alert");
    div.classList.add("alert-danger");

    div.role = "alert";

    div.appendChild(document.createTextNode(e.message));
  }
});

function resetPage() {
  saveBuffer = null;
  saveDataView = null;

  // Remove error alert, if any.
  const errorAlert = document.getElementById("error-alert-container");
  while (errorAlert.firstChild) {
    errorAlert.removeChild(errorAlert.firstChild);
  }

  populateField("gold", 0);
  populateField("ore", 0);
  populateField("aether", 0);

  document.getElementById("fields").disabled = true;
}

function processFile(file) {
  if (file.name != "Player.rc2dat") {
    throw new Error("That file has the wrong filename. It should be the one called Player.rc2dat.");
  }
  var reader = new FileReader();

  reader.onload = (event) => {
    saveBuffer = event.target.result;
    saveDataView = new DataView(saveBuffer);

    findOffsets(saveDataView);

    populateField("gold", getGold());
    populateField("ore", getOre());
    populateField("aether", getAether());

    document.getElementById("fields").disabled = false;
  };

  reader.readAsArrayBuffer(file);
}

function findOffsets(dataView) {
  let a = new Uint8Array(dataView.buffer.slice(0, 0x5d));
  let b = new Uint8Array([
    0x00, 0x01, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x02,
    0x00, 0x00, 0x00, 0x46, 0x41, 0x73, 0x73, 0x65, 0x6d, 0x62, 0x6c, 0x79, 0x2d, 0x43, 0x53, 0x68, 0x61, 0x72, 0x70,
    0x2c, 0x20, 0x56, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x3d, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x2c, 0x20,
    0x43, 0x75, 0x6c, 0x74, 0x75, 0x72, 0x65, 0x3d, 0x6e, 0x65, 0x75, 0x74, 0x72, 0x61, 0x6c, 0x2c, 0x20, 0x50, 0x75,
    0x62, 0x6c, 0x69, 0x63, 0x4b, 0x65, 0x79, 0x54, 0x6f, 0x6b, 0x65, 0x6e, 0x3d, 0x6e, 0x75, 0x6c, 0x6c,
  ]);
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] != b[i]) {
      throw "File contents are invalid.";
    }
  }
  let offset = 0x5d;

  if (dataView.getUint8(offset) !== 0x05) {
    throw "File contents are invalid.";
  }
  offset += 0x05;

  let className = dataView.getLengthPrefixedString(offset);

  if (className.value != "PlayerSaveData") {
    throw "Couldn't find PlayerSaveData object in the file.";
  }
  offset += className.byteLength;
  let goldIndex = null;
  let oreIndex = null;
  let aetherIndex = null;

  const memberCount = dataView.getInt32(offset, true);
  offset += 4;
  for (let i = 0; i < memberCount; i++) {
    let s = dataView.getLengthPrefixedString(offset);
    if (s.value == "GoldCollected") {
      goldIndex = i;
    } else if (s.value == "EquipmentOreCollected") {
      oreIndex = i;
    } else if (s.value == "RuneOreCollected") {
      aetherIndex = i;
    }
    offset += s.byteLength;
  }

  const binaryType = new Array(memberCount);
  for (let i = 0; i < memberCount; i++) {
    binaryType[i] = dataView.getUint8(offset);
    offset++;
  }

  const additionalInfo = new Array(memberCount);
  for (let i = 0; i < memberCount; i++) {
    if (binaryType[i] === 0 || binaryType[i] === 7) {
      additionalInfo[i] = dataView.getUint8(offset);
      offset += 1;
    } else if (binaryType[i] === 3) {
      offset += dataView.getLengthPrefixedString(offset).byteLength;
    } else if (binaryType[i] === 4) {
      offset += dataView.getLengthPrefixedString(offset).byteLength + 4;
    }
  }

  offset += 4;

  for (let i = 0; i < memberCount; i++) {
    if (binaryType[i] === 0) {
      if (i == goldIndex) {
        goldOffset = offset;
      } else if (i == oreIndex) {
        oreOffset = offset;
      } else if (i == aetherIndex) {
        aetherOffset = offset;
      }

      switch (additionalInfo[i]) {
        case 1:
          offset += 1;
          break;
        case 2:
          offset += 1;
          break;
        case 3:
          offset += 1;
          break;
        case 5:
          offset += 16;
          break;
        case 6:
          offset += 8;
          break;
        case 7:
          offset += 2;
          break;
        case 8:
          offset += 4;
          break;
        case 9:
          offset += 8;
          break;
        case 10:
          offset += 1;
          break;
        case 11:
          offset += 4;
          break;
        case 12:
          break;
        case 13:
          break;
        case 14:
          offset += 2;
          break;
        case 15:
          offset += 4;
          break;
        case 16:
          offset += 8;
          break;
        default:
          throw `Found invalid primitive type: ${type}`;
          break;
      }
    } else {
      const byteLength = dataView.getNRBFRecordLength(offset);
      offset += byteLength;
    }
  }
}

class LengthPrefixedString {
  constructor(value, byteLength) {
    this.value = value;
    this.byteLength = byteLength;
  }
}

DataView.prototype.getLengthPrefixedString = function (offset) {
  let lengthByte = this.getUint8(offset);
  let length = lengthByte & 0x7f;
  let lengthOffset = 0;
  while (lengthByte & 0x80) {
    lengthOffset++;
    lengthByte = this.getUint8(offset + lengthOffset);
    length ^= (lengthByte & 0x7f) << (7 * lengthOffset);
  }
  const stringBytes = this.buffer.slice(offset + lengthOffset + 1, offset + lengthOffset + length + 1);
  const utf8decoder = new TextDecoder();
  return new LengthPrefixedString(utf8decoder.decode(stringBytes), lengthOffset + length + 1);
};

DataView.prototype.getNRBFRecordLength = function (offset) {
  const startOffset = offset;
  let byteLength = 1;
  const recordType = this.getUint8(offset);
  offset++;
  if (recordType === 5) {
    offset += 0x04;

    let className = this.getLengthPrefixedString(offset);
    offset += className.byteLength;

    const memberCount = this.getInt32(offset, true);
    offset += 4;
    for (let i = 0; i < memberCount; i++) {
      let s = this.getLengthPrefixedString(offset);
      offset += s.byteLength;
    }

    const binaryType = new Array(memberCount);
    for (let i = 0; i < memberCount; i++) {
      binaryType[i] = this.getUint8(offset);
      offset++;
    }

    const additionalInfo = new Array(memberCount);
    for (let i = 0; i < memberCount; i++) {
      if (binaryType[i] === 0 || binaryType[i] === 7) {
        additionalInfo[i] = this.getUint8(offset);
        offset += 1;
      } else if (binaryType[i] === 3) {
        offset += this.getLengthPrefixedString(offset).byteLength;
      } else if (binaryType[i] === 4) {
        offset += this.getLengthPrefixedString(offset).byteLength + 4;
      }
    }

    offset += 4;

    for (let i = 0; i < memberCount; i++) {
      if (binaryType[i] === 0) {
        switch (additionalInfo[i]) {
          case 1:
            offset += 1;
            break;
          case 2:
            offset += 1;
            break;
          case 3:
            offset += 1;
            break;
          case 5:
            offset += 16;
            break;
          case 6:
            offset += 8;
            break;
          case 7:
            offset += 2;
            break;
          case 8:
            offset += 4;
            break;
          case 9:
            offset += 8;
            break;
          case 10:
            offset += 1;
            break;
          case 11:
            offset += 4;
            break;
          case 12:
            break;
          case 13:
            break;
          case 14:
            offset += 2;
            break;
          case 15:
            offset += 4;
            break;
          case 16:
            offset += 8;
            break;
          default:
            throw `Found invalid primitive type: ${type}`;
            break;
        }
      } else {
        const byteLength = this.getNRBFRecordLength(offset);
        offset += byteLength;
      }
    }
  } else if (recordType === 9) {
    offset += 4;
  } else if (recordType === 10) {
  } else {
    throw `Found bad record type at offset ${(offset - 1).toString(16)}, ${recordType}`;
  }
  return offset - startOffset;
};

function populateField(id, value) {
  let element = document.getElementById(id);
  element.value = value;
}

function getGold() {
  return saveDataView.getUint32(goldOffset, true);
}

function setGold(amount) {
  setUint32(goldOffset, amount);
}

function getOre() {
  return saveDataView.getUint32(oreOffset, true);
}

function setOre(amount) {
  setUint32(oreOffset, amount);
}

function getAether() {
  return saveDataView.getUint32(aetherOffset, true);
}

function setAether(amount) {
  setUint32(aetherOffset, amount);
}

function setUint32(offset, amount) {
  let value = parseInt(amount || 0, 10);
  value = Math.min(value, 4294967295);
  value = Math.max(value, 0);
  saveDataView.setUint32(offset, value, true);
}

function downloadSaveFile() {
  if (saveBuffer === null) {
    return;
  }
  saveAs(new Blob([saveBuffer]), "Player.rc2dat");
}
