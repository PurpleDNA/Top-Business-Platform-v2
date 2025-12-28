import { createClient } from "@/supabase/server";

export const getTotalBusinessOutstanding = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_total_business_outstanding"
    );
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error fetching total business outstanding:", error);
    return 0;
  }
};
