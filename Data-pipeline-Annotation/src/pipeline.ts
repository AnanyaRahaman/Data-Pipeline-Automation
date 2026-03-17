import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as cheerio from "cheerio";
import { spawnPy } from "./spawnPy";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFacts(
  company: string,
  period: string,
  docType: string,
  url: string,
  html: string,
  runId: string
) {
  const $ = cheerio.load(html);
  const facts: any[] = [];

  // Page title
  const title = $("title").text().trim();
  if (title) {
    facts.push({
      run_id: runId,
      company,
      period_of_report: period,
      document_type: docType,
      source_url: url,
      fact_type: "page_title",
      fact_value: title,
      confidence: "explicit",
    });
  }

  // H1 headings
  $("h1").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      facts.push({
        run_id: runId,
        company,
        period_of_report: period,
        document_type: docType,
        source_url: url,
        fact_type: "heading_h1",
        fact_value: text,
        confidence: "explicit",
      });
    }
  });

  // Email extraction
  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const emailMatch = html.match(emailRegex);
  if (emailMatch) {
    facts.push({
      run_id: runId,
      company,
      period_of_report: period,
      document_type: docType,
      source_url: url,
      fact_type: "email",
      fact_value: emailMatch[0],
      confidence: "explicit",
    });
  }

  // Extract tables
  $("table").each((i, table) => {
    const rows: string[][] = [];
    $(table)
      .find("tr")
      .each((_, row) => {
        const cells: string[] = [];
        $(row)
          .find("th, td")
          .each((_, cell) => {
            cells.push($(cell).text().trim());
          });
        if (cells.length > 0) rows.push(cells);
      });

    if (rows.length > 0) {
      facts.push({
        run_id: runId,
        company,
        period_of_report: period,
        document_type: docType,
        source_url: url,
        fact_type: "table",
        fact_value: rows,
        confidence: "explicit",
      });
    }
  });

  return facts;
}

async function run() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  const outIndex = args.indexOf("--out");

  if (inputIndex === -1 || outIndex === -1) {
    console.error("Usage: npm run pipeline -- --input data.csv --out out/");
    process.exit(1);
  }

  const inputPath = args[inputIndex + 1];
  const outDir = args[outIndex + 1];

  const csvContent = fs.readFileSync(inputPath, "utf-8");

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const runId = new Date().toISOString();
  const allFacts: any[] = [];

  for (const row of records) {
    const company = row["Company"];
    const period = row["Period of Report"];
    const docType = row["Document Type"];
    const url = row["URL"];

    if (!url) {
      allFacts.push({
        run_id: runId,
        company,
        period_of_report: period,
        document_type: docType,
        source_url: null,
        fact_type: "missing_url",
        fact_value: "No URL provided",
        confidence: "error",
      });
      continue;
    }

    console.log(`Fetching ${url}`);

    try {
      const result = await spawnPy({ url });

      if (result.error) {
        allFacts.push({
          run_id: runId,
          company,
          period_of_report: period,
          document_type: docType,
          source_url: url,
          fact_type: "fetch_error",
          fact_value: result.error,
          confidence: "error",
        });
        continue;
      }

      const facts = extractFacts(
        company,
        period,
        docType,
        url,
        result.html,
        runId
      );

      allFacts.push(...facts);

      await sleep(1000); // polite delay
    } catch (err: any) {
      allFacts.push({
        run_id: runId,
        company,
        period_of_report: period,
        document_type: docType,
        source_url: url,
        fact_type: "pipeline_error",
        fact_value: err.message,
        confidence: "error",
      });
    }
  }

  fs.mkdirSync(outDir, { recursive: true });

  const jsonl = allFacts.map((f) => JSON.stringify(f)).join("\n");

  fs.writeFileSync(
    path.join(outDir, "facts.jsonl"),
    jsonl
  );

  fs.writeFileSync(
    path.join(outDir, "run_summary.json"),
    JSON.stringify(
      {
        run_id: runId,
        total_facts: allFacts.length,
        total_records_processed: records.length,
      },
      null,
      2
    )
  );

  console.log("Pipeline completed.");
}

run();