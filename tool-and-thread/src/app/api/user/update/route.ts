import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { hash, compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await req.json();
    const updates: Record<string, string> = {};

    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Update email if provided
    if (updates.email && updates.email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: updates.email },
      });

      if (existingUser) {
        return new NextResponse("Email already taken", { status: 400 });
      }
    }

    // Update password if provided
    if (data.currentPassword && data.newPassword) {
      // Verify current password
      const passwordValid = await compare(data.currentPassword, user.password);
      if (!passwordValid) {
        return new NextResponse("Invalid current password", { status: 400 });
      }

      updates.password = await hash(data.newPassword, 10);
    }

    // If no updates, return early
    if (Object.keys(updates).length === 0) {
      return new NextResponse("No updates provided", { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({
      message: "User updated successfully",
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
