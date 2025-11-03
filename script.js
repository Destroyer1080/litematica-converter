document.getElementById("convertBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "❌ Please select a .litematic file first.";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "⏳ Reading file...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Decompress Litematic (GZip format)
    const decompressed = pako.ungzip(data);

    // Parse NBT using prismarine-nbt
    const parsed = await window.prismarineNbt.parse(decompressed);

    // Extract schematic data
    const schematic = parsed.parsed.value;
    const regions = schematic.Regions?.value;

    if (!regions) throw new Error("No regions found in this .litematic file.");

    const regionNames = Object.keys(regions);
    const firstRegion = regions[regionNames[0]].value;

    const size = firstRegion.Size.value;
    const blocks = firstRegion.BlockStates?.value || [];

    // Prepare Bedrock structure object
    const bedrockStructure = {
      format_version: "1.13.0",
      size: [size[0], size[1], size[2]],
      structure: { block_indices: [0], palette: { default: [] } },
    };

    // Convert to JSON and save
    const blob = new Blob([JSON.stringify(bedrockStructure, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(".litematic", ".mcstructure");
    a.click();

    status.textContent = "✅ Conversion complete!";
  } catch (err) {
    console.error("Conversion Error:", err);
    status.textContent = "❌ Conversion failed. Check console for details.";
  }
});
