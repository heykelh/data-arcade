import { notFound } from "next/navigation";
import { getGame } from "@/games/registry";
import { C } from "@/lib/palette";
import GameMusic from "./GameMusic";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || !game.live || !game.Component) notFound();
  const Game = game.Component;
  return (
    <main style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto", padding: "16px 16px 40px", color: C.ink }}>
      <GameMusic src={game.music} />
      <Game />
    </main>
  );
}
