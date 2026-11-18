
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
let supabase;

module.exports = function getSupabase() {
    if (!supabaseUrl || !supabaseKey) {
        const error = new Error(
            "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SECRET_KEY."
        );
        error.statusCode = 503;
        throw error;
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }

    return supabase;
};
