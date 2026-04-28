import { createProjectSchema } from "@/modules/projects/project.schema";
import { createProject, listProjectsByAgency } from "@/modules/projects/project.service";
import { ValidationError } from "@/server/http-errors";
import { handleRouteError } from "@/server/route-handler";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId") ?? "";
    const projects = await listProjectsByAgency(agencyId);

    return Response.json({ data: projects });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Invalid project payload", parsed.error.flatten());
    }

    const project = await createProject(parsed.data);
    return Response.json({ data: project }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
