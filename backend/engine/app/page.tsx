export default function Home() {
	return (
		<main style={{ fontFamily: 'system-ui', padding: '2rem', lineHeight: 1.6 }}>
			<h1>Pong Engine Backend</h1>
			<p>This workspace now runs on Next.js API routes and WebSockets.</p>
			<ul>
				<li>Health check: <code>/api/health</code></li>
				<li>Create rooms: <code>POST /api/rooms</code></li>
				<li>Join rooms: <code>POST /api/rooms/&lt;roomId&gt;/join</code></li>
				<li>WebSocket endpoint: <code>/api/ws</code></li>
			</ul>
		</main>
	);
}
