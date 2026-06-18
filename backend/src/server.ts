import 'dotenv/config';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 3001);

const app = createApp();

app.listen(port, () => {
  console.log(`JobFit backend listening on http://localhost:${port}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER ?? 'groq'} (override per request via aiProvider field)`);
});
