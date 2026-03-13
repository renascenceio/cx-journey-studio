import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string || 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type based on purpose
    const allowedForEvidence = [
      'image/', 'video/', 'application/pdf',
      'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-excel',
      'text/csv', 'application/msword',
    ]
    if (purpose === 'avatar') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
    } else if (purpose === 'evidence') {
      if (!allowedForEvidence.some((t) => file.type.startsWith(t))) {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
      }
    }

    // Validate file size (max 10MB for evidence, 5MB for avatars)
    const maxSize = purpose === 'evidence' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File must be under ${purpose === 'evidence' ? '10' : '5'}MB` }, { status: 400 })
    }

    const blob = await put(`${purpose}/${user.id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // If avatar, update profile (column is 'avatar' not 'avatar_url')
    if (purpose === 'avatar') {
      await supabase
        .from('profiles')
        .update({ avatar: blob.url })
        .eq('id', user.id)
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
