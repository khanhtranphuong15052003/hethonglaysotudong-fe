export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // TODO: Thực hiện xóa service từ database
    // Ví dụ: await deleteServiceFromDB(id);

    // Tạm thời return mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Service deleted successfully",
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
        error: "Failed to delete service",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
