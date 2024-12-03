import GameCard from "./gameCard";

function GameManager({ games, handleDelete, joinable, handleJoin }) {
    return (
        <div className="games">
            {games
                .map((game, index) => (
                    <GameCard
                        key={game.gameID.toString() + index.toString()} // Use index as a fallback
                        gameData={game}
                        handleDelete={handleDelete}
                        joinable={joinable}
                        handleJoin={handleJoin}
                    />
                ))}
        </div>
    );
}

export default GameManager;