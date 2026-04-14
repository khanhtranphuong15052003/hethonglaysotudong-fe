export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  try {
    const { id, serviceId } = await params;

    // TODO: Thực hiện xóa service khỏi counter từ database
    // Ví dụ: await removeServiceFromCounterInDB(id, serviceId);

    // Tạm thời return mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Service removed from counter successfully",
        data: {
          _id: id,
          removedServiceId: serviceId,
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
        error: "Failed to remove service from counter",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
