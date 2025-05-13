// ai-agent.js
import OpenAI from "openai";
import jaysonPkg from "jayson/promise/index.js";      // import the whole pkg
const { Client: JaysonClient } = jaysonPkg;           // extract the Client
import fetch from "node-fetch";
import dotenv from 'dotenv'; // Import dotenv

const APIKEY = process.env.APIKEY;
const openai = new OpenAI({ apiKey: APIKEY });

const rpc = JaysonClient.http({
  hostname: "localhost",
  port: 10000,
  path: "/jsonrpc"
});



export async function postAsCharacter(topic, character) {
  const systemPrompt = `
    You are a character from the Harry Potter universe. You are ${character}. The wizard world still exists and you are a part of it. Except you are also now living in the modern world (year 2025) where people use social media and instant messaging. You are still heavily based on your character from the series, and you are now a social media influencer as well. You are very good at it. You are very creative and you can come up with great ideas for posts. You are also very good at writing and you can write very well. You also use modern day slang. You are also very good at using emojis and you can use them very well. You are also very good at using hashtags and you can use them very well.
  `;
  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Draft a Facebook post about: ${topic}. Start it off by saying a modern day social media greeting and who you are.` }
    ]
  });
  const draft = chat.choices[0].message.content.trim();
  try {
    const rpcRes = await rpc.request("postToPage", { message: draft });
    console.log("🚀 Posted with ID:", rpcRes.result.postId);
  } catch (err) {
    if (err.code === "ECONNRESET") {
      // socket hang-up—swallow it
      console.warn("⚠️ Ignoring socket hang-up on postToPage");
    } else {
      // any other error is real: re-throw
      throw err;
    }
  }

  // 3) always return the draft
  return draft;
}
