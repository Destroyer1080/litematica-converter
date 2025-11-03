document.getElementById("convertBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please choose a .litematic file first.";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "Reading and parsing .litematic file...";
  console.clear();

  try {
    // Read file and decompress
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    const decompressed = pako.inflate(byteArray);

    // Parse NBT (big-endian = Java format)
    nbt.parse(decompressed.buffer, 'big', (err, data) => {
      if (err) {
        console.error("NBT Parse Error:", err);
        status.textContent = "❌ Could not parse .litematic file (invalid or corrupted).";
        return;
      }

      const schematic = data.value;
      const regions = schematic.Regions.value;
      const regionNames = Object.keys(regions);
      if (!regionNames.length) {
        status.textContent = "❌ No regions found in this .litematic file.";
        return;
      }

      const firstRegionName = regionNames[0];
      const region = regions[firstRegionName].value;
      const size = region.Size.value;
      const x = size.x.value, y = size.y.value, z = size.z.value;
      const blockPalette = region.BlockStatePalette.value.map(b => b.value.Name.value);

      console.log("Region:", firstRegionName);
      console.log("Dimensions:", x, y, z);
      console.log("Palette:", blockPalette);

      status.textContent = `✅ Parsed successfully: ${firstRegionName} (${x}×${y}×${z}), ${blockPalette.length} block types`;

      // Build minimal .mcstructure object
      const mcstructure = {
        format_version: 1,
        size: [x, y, z],
        structure: {
          block_indices: [[]],
          entities: [],
          palette: { default: [] }
        }
      };

      // Basic palette mapping
      for (let i = 0; i < blockPalette.length; i++) {
        mcstructure.structure.palette.default.push({
          name: blockPalette[i].replace("minecraft:", "")
        });
        mcstructure.structure.block_indices[0].push(i);
      }

      // Encode and create downloadable file
      const mcNBT = nbt.writeUncompressed(mcstructure);
      const blob = new Blob([mcNBT], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".litematic", ".mcstructure");
      a.click();
      URL.revokeObjectURL(url);

      status.textContent = "✅ Converted successfully! Check your downloads folder.";
    });

  } catch (error) {
    console.error("Conversion Error:", error);
    status.textContent = "❌ Conversion failed. See console for details.";
  }
});

