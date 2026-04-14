export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // TODO: Thực hiện xóa counter từ database
    // Ví dụ: await deleteCounterFromDB(id);

    // Tạm thời return mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Counter deleted successfully",
        data: { _id: id },
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
        error: "Failed to delete counter",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
