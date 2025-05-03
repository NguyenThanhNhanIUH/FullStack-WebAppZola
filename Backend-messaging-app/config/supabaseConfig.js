import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabaseClient = createClient(supabaseUrl, supabaseKey)

export const USER_AVATARS_BUCKET = "user-avatars"
export const IMAGES_BUCKET = "images"


export const initializeStorage = async () => {
  try {

    const { data: buckets } = await supabaseClient.storage.listBuckets()

    if (!buckets.find((bucket) => bucket.name === USER_AVATARS_BUCKET)) {
      await supabaseClient.storage.createBucket(USER_AVATARS_BUCKET, {
        public: false,
        fileSizeLimit: 5242880, 
      })
      console.log(`Created ${USER_AVATARS_BUCKET} bucket`)
    }

    if (!buckets.find((bucket) => bucket.name === IMAGES_BUCKET)) {
      await supabaseClient.storage.createBucket(IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, 
      })
      console.log(`Created ${IMAGES_BUCKET} bucket`)
    }

    console.log("Supabase storage initialized successfully")
  } catch (error) {
    console.error("Error initializing Supabase storage:", error)
  }
}

export { supabaseClient }
