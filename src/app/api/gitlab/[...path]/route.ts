import { NextRequest, NextResponse } from "next/server"

const GITLAB_URL = process.env.GITLAB_URL || "http://gitlab.nzcs.kz"
const GITLAB_API_TOKEN = process.env.GITLAB_API_TOKEN || ""
const GITLAB_API_VERSION = process.env.GITLAB_API_VERSION || "v4"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join("/")
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ""

  const url = `${GITLAB_URL}/api/${GITLAB_API_VERSION}/${path}${queryString}`

  try {
    const response = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": GITLAB_API_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitLab API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
