import { parse } from "ts-command-line-args";

interface GeneratorOptions {
  circuit: string;
  input: string;
}

const options = parse<GeneratorOptions>({
  circuit: {
    type: String,
    alias: "c",
    description: "Path to the circuit folder",
  },
  input: {
    type: String,
    alias: "i",
    description: "Path to the input file",
  },
});

async function main() {
  const generator = await import(`./${options.circuit}/generate.ts`);
  await generator.generate(`./inputs/${options.circuit}/${options.input}`);
  console.log("Done");
}

main().then().catch(console.log);
