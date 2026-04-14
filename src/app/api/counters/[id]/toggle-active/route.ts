export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // TODO: Thực hiện toggle active status của counter từ database
    // Lấy counter hiện tại, đảo ngược isActive value

    // Tạm thời return mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Counter status toggled successfully",
        data: {
          _id: id,
          isActive: true, // Đảo ngược trạng thái
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
        error: "Failed to toggle counter active status",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
