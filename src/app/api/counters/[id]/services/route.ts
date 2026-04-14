export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceIds } = body;

    if (!serviceIds || !Array.isArray(serviceIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "serviceIds must be an array",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // TODO: Thực hiện thêm services vào counter từ database
    // Ví dụ: await addServicesToCounterInDB(id, serviceIds);

    // Tạm thời return mock response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Services added to counter successfully",
        data: {
          _id: id,
          services: serviceIds,
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
        error: "Failed to add services to counter",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
