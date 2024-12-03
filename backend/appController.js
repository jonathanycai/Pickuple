import express from 'express';
import {
    getOracleConnection,
    getRegisteredGames,
    getLocation,
    getUser,
    getMaxId,
    createUser,
    createUserLocation,
    getAllRegUsers,
    getCommentsByUser,
    getReservationByPostalCode,
    getUserCreateMultGame,
    getUserRegMoreThanAvg,
    updateUserInfo
} from './appService.js';
import multer from 'multer';
import { createComment, createGameInvite, deleteComment, getComments, getPastGames, getRegisteredUsers, getReplies, registerForGame } from './services/gameInviteService.js';
import { createReservation } from './services/reservationService.js';
import { createGame, deleteGame, getGamesToJoin } from './services/gameService.js';
import { fetchCourtsFromDb, getAddresses, getCityLocations, getPostalCodes, getProvinceLocations } from './services/locationService.js';
import { createPicture, deleteThumbnail, getThumbnailUrls } from './services/pictureService.js';

const router = express.Router();
const app = express();
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.

router.post("/create-game", upload.single('thumbnail'), async (req, res) => {
    let connection;
    let thumbnail = null;
    try {
        connection = await getOracleConnection();
        if (req.file) {
            thumbnail = await createPicture(connection, req.file);
        }
        const { location, reservation, game, gameInvite, userID } = req.body;
        const gameInviteID = await createGameInvite(connection, gameInvite, thumbnail, userID);
        const reservationID = await createReservation(connection, reservation, location);
        await createGame(connection, game, reservationID, gameInviteID);
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        console.log(err);
        if (thumbnail) {
            await deleteThumbnail(thumbnail);
        }
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

router.get("/get-courts", async (req, res) => {
    const courts = await fetchCourtsFromDb();
    return res.json({ courts: courts })
})

router.post("/get-registered", async (req, res) => {
    const users = await getRegisteredUsers(req.body);
    return res.json({users: users});
})

router.get("/get-comments/:inviteId", async (req, res) => {
    const comments = await getComments(req.params.inviteId);
    return res.json({ comments: comments });
})

router.get("/get-replies/:commentId", async (req, res) => {
    const replies = await getReplies(req.params.commentId);
    return res.json({ replies: replies });
})

router.post("/create-comment", async (req, res) => {
    const { content, userID, inviteID, parentID } = req.body;
    const result = await createComment(content, userID, inviteID, parentID);
    if (result) {
        return res.json({ success: result });
    } else {
        return res.status(500).json({ success: result });
    }
})

router.delete("/delete-comment/:commentId", async (req, res) => {
    const result = await deleteComment(req.params.commentId);
    if (result) {
        return res.json({ success: result });
    } else {
        return res.status(500).json({ success: result });
    }
})

router.delete("/delete-game/:inviteID", async (req, res) => {
    const result = await deleteGame(req.params.inviteID);
    if (result) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post('/get-joinable-games', async (req, res) => {
    const {userID, clauses} = req.body;
    const games = await getGamesToJoin(userID, clauses);
    res.json({games});
});

router.post('/register-for-game', async (req, res) => {
    const {userID, inviteID} = req.body
    const result = await registerForGame(userID, inviteID);
    if (result) {
        res.json({success: true});
    } else {
        res.status(500).json({success: false});
    }
});

router.get('/get-locations', async (req, res) => {
    const addresses = await getAddresses();
    const postalCodes = await getPostalCodes();
    const cities = await getCityLocations();
    const provinces = await getProvinceLocations();
    if (addresses.length === 0 || postalCodes.length === 0 || cities.length === 0 || provinces.length === 0) {
        res.status(500).json();
    } else {
        res.json({addresses, postalCodes, cities, provinces});
    }
})

router.get("/get-game-history", async (req, res) => {
    const { userID } = req.query;

    if (!userID) {
        console.error("Error: userID is required");
        res.status(400).json({ success: false, message: "userID is required" });
        return;
    }

    try {
        const games = await getPastGames(userID);
        await getThumbnailUrls(games);
        if (games.length > 0) {
            console.log("Sending 200 response with games:", games);
            res.json({ success: true, games });
        } else {
            res.status(404).json({ success: true, message: "No past games found", games: [] });
        }
    } catch (error) {
        console.error("Error fetching past games:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// get table of all registered games
router.get("/registered-games", async (req, res) => {
    const { userID } = req.query;

    if (!userID) {
        console.error("Error: userID is required");
        res.status(400).json({ success: false, message: "userID is required" });
        return;
    }

    try {
        const games = await getRegisteredGames(userID);
        await getThumbnailUrls(games);
        if (games.length > 0) {
            console.log("Sending 200 response with games:", games);
            res.json({ success: true, games });
        } else {
            res.status(404).json({ success: true, message: "No registered games found", games: [] });
        }
    } catch (error) {
        console.error("Error fetching registered games:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/get-user", async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const user = await getUser(email);
        if (!user || user.length === 0) {
            return res.status(404).json({ user: [] });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/get-location", async (req, res) => {
    const { address, province, city } = req.query;

    try {
        const user = await getLocation(address, province, city);
        if (!user || user.length === 0) {
            return res.status(404).json({ user: [] });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/get-max-id", async (req, res) => {
    try {
        const currMaxID = await getMaxId(); // Call the getMaxId function
        console.log("Current Max ID:", currMaxID);

        // If currMaxID is null (no users in table), default to 0
        const nextMaxID = currMaxID != null ? currMaxID + 1 : 1;

        return res.status(200).json({ maxID: nextMaxID });
    } catch (error) {
        console.error("Error fetching maxId:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



router.post("/insert-user-info", async (req, res) => {
    const { userID, email, password, firstName, lastName, address, province, city, profilePicture } = req.body;
    try {
        const insertResult = await createUser(userID, email, password, firstName, lastName, profilePicture, address, province, city);
        if (insertResult) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: "Failed to insert user info" });
        }
    } catch (error) {
        console.error("Error inserting user info:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


router.post("/insert-user-location", async (req, res) => {
    const { address, province, city, postalCode } = req.body;
    console.log("Attempting to insert user location...");
    try {
        const insertResult = await createUserLocation(address, province, city, postalCode);
        if (insertResult) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: "Failed to insert user location" });
        }
    } catch (error) {
        // console.error("Error inserting user location:", error);
        console.log(error.code);
        // Check for unique constraint violation
        if (error.code === 'ORA-00001' || error.message.includes("ORA-00001")) {
            res.status(409).json({ success: false, message: "Location already exists" });
        } else {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
});

router.get("/get-all-registered-users", async (req, res) => {
    try {
        const registeredAllGamesUsers = await getAllRegUsers();
        if (registeredAllGamesUsers.length > 0) {
            res.json({ success: true, registeredAllGamesUsers });
        } else {
            res.status(404).json({ success: true, message: "No registered users found", registeredAllGamesUsers: [] });
        }
    } catch (error) {
        console.error("Error getting users", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

router.get("/get-comments-by-user", async (req, res) => {
    try {
        const { userID } = req.query;
        const comments = await getCommentsByUser(userID);
        if (comments.length > 0) {
            res.json({ success: true, comments });
        } else {
            res.status(404).json({ success: true, message: "No comments found", comments: [] });
        }
    } catch (error) {
        console.error("Error getting users", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

router.put("/update-user-info", async (req, res) => {
    const { userID, localEmail, localPassword, localFirstName, localLastName, localProfilePicture, localAddress, localProvince, localCity } = req.body;

    console.log(`Number+${userID}`)
    console.log(`Type of userID: ${typeof userID}`);

    try {
      const updateResult = await updateUserInfo(userID, localEmail, localPassword, localFirstName, localLastName, localProfilePicture, localAddress, localProvince, localCity);
      if (updateResult) {
        res.json({ success: true });
        console.log('IT WORKED')
      } else {
        res.status(500).json({ success: false, message: "Failed to update user info" });
      }
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

router.get("/get-reservation-postalcode", async (req, res) => {
    try {
        const reservations = await getReservationByPostalCode();
        if (reservations.length > 0) {
            res.json({ success: true, reservations });
        } else {
            res.status(404).json({ success: true, message: "No reservation found", reservations: [] });
        }
    } catch (error) {
        console.error("Error getting reservations", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

router.get("/get-user-create-mult-games", async (req, res) => {
    try {
        const users = await getUserCreateMultGame();
        if (users.length > 0) {
            res.json({ success: true, users });
        } else {
            res.status(404).json({ success: true, message: "No comments found", users: [] });
        }
    } catch (error) {
        console.error("Error getting users", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

router.get("/get-user-reg-more-avg", async (req, res) => {
    try {
        const users = await getUserRegMoreThanAvg();
        if (users.length > 0) {
            res.json({ success: true, users });
        } else {
            res.status(404).json({ success: true, message: "No comments found", users: [] });
        }
    } catch (error) {
        console.error("Error getting users", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
})

export default router;