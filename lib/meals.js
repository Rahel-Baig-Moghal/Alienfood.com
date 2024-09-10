import { MongoClient } from 'mongodb';
import fs from 'fs';
import slugify from 'slugify';
import xss from 'xss';

// MongoDB URL
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'test';
const COLLECTION_NAME = 'meals';

// Function to connect to MongoDB
async function connectToDB() {
  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);
  return { client, db };
}

// Function to save a meal
export async function saveMeal(meal) {
  // Sanitize and generate a slug for the meal title
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split('.').pop();
  const fileName = `${meal.slug}.${extension}`;
  const filePath = `public/images/${fileName}`;

  // Convert image to buffer and save
  const bufferedImage = Buffer.from(await meal.image.arrayBuffer());
  fs.writeFileSync(filePath, bufferedImage, (error) => {
    if (error) {
      throw new Error('Saving image failed!');
    }
  });

  // Set the image path in the meal object
  meal.image = `/images/${fileName}`;

  // Add the version field __v
  meal.__v = 0;

  // Insert the meal into MongoDB
  const { client, db } = await connectToDB();
  const collection = db.collection(COLLECTION_NAME);
  await collection.insertOne(meal);
  await client.close();
}

// Function to get all meals
export async function getMeals() {
  const { client, db } = await connectToDB();
  const collection = db.collection(COLLECTION_NAME);

  // Wait for 2 seconds before fetching the data
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Fetch all the documents from the 'meals' collection
  const meals = await collection.find({}).toArray();

  // Close the MongoDB connection
  await client.close();

  return meals;
}

// Function to get a single meal by slug
export async function getMeal(slug) {
  const { client, db } = await connectToDB();
  const collection = db.collection(COLLECTION_NAME);

  // Fetch the document from the 'meals' collection that matches the slug
  const meal = await collection.findOne({ slug: slug });

  // Close the MongoDB connection
  await client.close();

  return meal;
}
