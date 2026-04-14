import { tickets } from "@/mock/data";

export async function GET() {
  try {
    return new Response(
      JSON.stringify({
        success: true,
        data: tickets,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch tickets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
