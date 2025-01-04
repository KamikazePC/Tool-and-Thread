import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash, compare } from "bcrypt";
import {prisma} from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    let updates: any = {};

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return new NextResponse("Email already taken", { status: 400 });
      }

      updates.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const passwordValid = await compare(currentPassword, user.password);
      if (!passwordValid) {
        return new NextResponse("Invalid current password", { status: 400 });
      }

      updates.password = await hash(newPassword, 10);
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
