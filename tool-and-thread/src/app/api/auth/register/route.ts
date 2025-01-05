import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // Check if user exists
    const exists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json({ message: "User created successfully" });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}
