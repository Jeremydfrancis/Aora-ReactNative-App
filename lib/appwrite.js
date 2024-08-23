// @ts-ignore
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID,
  APPWRITE_VIDEO_COLLECTION_ID,
  APPWRITE_STORAGE_ID,
} from "@env";

export const appwriteConfig = {
  endpoint: APPWRITE_ENDPOINT,
  platform: "com.jeremy.aora",
  projectId: APPWRITE_PROJECT_ID,
  storageId: APPWRITE_STORAGE_ID,
  databaseId: APPWRITE_DATABASE_ID,
  userCollectionId: APPWRITE_USER_COLLECTION_ID,
  videoCollectionId: APPWRITE_VIDEO_COLLECTION_ID,
};
// Initialize react-native appwrite SDK
const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

let cache = {};
let cacheExpiry = {};

const CACHE_DURATION = 60000; // 1 minute cache duration

function setCache(key, value) {
  cache[key] = value;
  cacheExpiry[key] = Date.now() + CACHE_DURATION;
}

function getCache(key) {
  if (cache[key] && cacheExpiry[key] > Date.now()) {
    return cache[key];
  } else {
    // Cache expired or does not exist
    invalidateCache(key);
    return null;
  }
}

function invalidateCache(key) {
  delete cache[key];
  delete cacheExpiry[key];
}

// Safe Execute Function to handle errors in async functions and log them to the console for debugging purposes
async function safeExecute(promise, errorMessage, errorContext = {}) {
  try {
    const result = await promise;
    if (!result) throw new Error(errorMessage || "An unknown error occurred");
    return result;
  } catch (error) {
    console.error({ error, ...errorContext });
    throw new Error(error.message);
  }
}

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await safeExecute(
      account.create(ID.unique(), email, password, username),
      "Failed to create a new account",
      { email, username }
    );

    if (!newAccount) {
      throw new Error("Account creation failed.");
    }

    const avatarUrl = avatars.getInitials(username);

    const session = await safeExecute(
      signIn(email, password),
      "Sign-in failed"
    );

    if (!session) {
      throw new Error("Sign-in failed after account creation.");
    }

    const userDoc = await safeExecute(
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email,
          username,
          avatar: avatarUrl,
        }
      ),
      "Failed to create a new user document"
    );

    if (!userDoc) {
      throw new Error("User document creation failed.");
    }

    return userDoc;
  } catch (error) {
    console.error("Error in createUser:", error.message);
    return null;
  }
}

// Sign In
export async function signIn(email, password) {
  const session = await safeExecute(
    account.createEmailSession(email, password)
  );

  if (!session) {
    throw new Error(
      "Failed to create a session. Please check your email and password."
    );
  }

  return session;
}

// Get Account
export async function getAccount() {
  const currentAccount = await safeExecute(account.get());

  if (!currentAccount) {
    throw new Error(
      "Failed to retrieve the account. The account might not exist or there was an issue with the request."
    );
  }

  return currentAccount;
}

// Get Current User
// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await safeExecute(
      getAccount(),
      "Failed to retrieve the current account"
    );

    if (!currentAccount) return null;

    // Fetch the user document without relying on the cache
    const currentUser = await safeExecute(
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      ),
      "Failed to retrieve user data from the database"
    );

    if (!currentUser || currentUser.documents.length === 0) {
      console.error("No user found for the current account.");
      return null;
    }

    const userDocument = currentUser.documents[0];

    // Temporarily bypassing caching to ensure fresh data
    setCache(`user_${currentAccount.$id}`, userDocument);

    return userDocument;
  } catch (error) {
    console.error("Error in getCurrentUser:", error.message);
    return null;
  }
}

// Sign Out
export async function signOut() {
  const session = await safeExecute(account.deleteSession("current"));

  if (!session) {
    throw new Error("Failed to sign out. The session could not be deleted.");
  }

  return session;
}

// Upload File

export async function uploadFile(file, type) {
  if (!file) return;
  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );
    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    // Determine the file URL based on the type (video or image)
    if (type === "video") {
      fileUrl = await safeExecute(
        storage.getFileView(appwriteConfig.storageId, fileId)
      );
    } else if (type === "image") {
      fileUrl = await safeExecute(
        storage.getFilePreview(
          appwriteConfig.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        )
      );
    } else {
      throw new Error("Invalid file type. Expected 'video' or 'image'.");
    }

    // Check if the file URL was successfully retrieved
    if (!fileUrl) {
      throw new Error(
        "Failed to retrieve the file URL. The file might not exist or there was an error in the storage service."
      );
    }

    return fileUrl;
  } catch (error) {
    console.error("Error in getFilePreview:", error.message);
    return null;
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts() {
  const cacheKey = "allPosts";
  const cachedPosts = getCache(cacheKey);

  if (cachedPosts) {
    return cachedPosts;
  }

  try {
    const posts = await safeExecute(
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.orderDesc("$createdAt")]
      ),
      "Failed to retrieve posts"
    );

    if (!posts || !posts.documents) {
      throw new Error("No posts found. The database might be empty.");
    }

    setCache(cacheKey, posts.documents);
    return posts.documents;
  } catch (error) {
    console.error("Error in getAllPosts:", error.message);
    return null;
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  const posts = await safeExecute(
    databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")],
      Query.select([
        "title",
        "thumbnail",
        "video",
        "creator.username",
        "creator.avatar",
      ])
    ),
    `Failed to retrieve posts for user: ${userId}`
  );

  return posts.documents;
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await safeExecute(
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.search("title", query)]
      )
    );

    if (!posts || posts.documents.length === 0) {
      throw new Error(
        `No posts found matching the query: "${query}". The search might have returned no results or there could be an issue with the database.`
      );
    }

    return posts.documents;
  } catch (error) {
    console.error("Error in searchPosts:", error.message);
    return null;
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await safeExecute(
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(7)]
      )
    );

    if (!posts || posts.documents.length === 0) {
      throw new Error(
        "Failed to retrieve the latest posts. The database might be empty or there could be an issue with the query."
      );
    }

    return posts.documents;
  } catch (error) {
    console.error("Error in getLatestPosts:", error.message);
    return null;
  }
}

/* 1. Debounce or Throttle API Calls
If any functions are being called frequently (e.g., searchPosts), 
you might want to debounce or throttle these API calls to avoid unnecessary network requests.

Debouncing is a technique used to limit the rate at which a function is called.
It ensures that the function is not called more than once in a specified time interval.
Lodash provides a debounce function that can be used to debounce function calls.

Here's an example of how you can debounce the searchPosts function using lodash's debounce function:

Example Code:

import { debounce } from 'lodash';

const debouncedSearch = debounce((query) => {
    return searchPosts(query);
}, 300); */
