import { parse } from "ts-command-line-args";

interface GeneratorOptions {
  circuit: string;
  input: string;
}

const options = parse<GeneratorOptions>({
  circuit: {
    type: String,
    alias: "c",
    description: "Circuit name",
  },
  input: {
    type: String,
    alias: "i",
    description: "input file name",
  },
});

async function main() {
  const generator = await import(`./${options.circuit}/generate.ts`);
  await generator.generate(`./inputs/${options.circuit}/${options.input}`);
  console.log("Done");
}

main().then().catch(console.log);
