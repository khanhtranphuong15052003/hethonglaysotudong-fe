import { getWaitingList, getNowCalling } from "@/mock/queue";

export async function GET() {
  try {
    const waitingList = getWaitingList();
    const nowCalling = getNowCalling();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          waitingList,
          nowCalling,
        },
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
        error: "Failed to fetch queue",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
