import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate cost center codes...\n')
    
    // Find all cost centers with duplicate codes
    const costCenters = await prisma.costCenter.findMany({
      select: {
        id: true,
        code: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { code: 'asc' }
    })

    console.log(`Total cost centers: ${costCenters.length}\n`)

    // Group by code
    const codeGroups = new Map()
    costCenters.forEach(cc => {
      if (!codeGroups.has(cc.code)) {
        codeGroups.set(cc.code, [])
      }
      codeGroups.get(cc.code).push(cc)
    })

    // Find duplicates
    let hasDuplicates = false
    for (const [code, centers] of codeGroups) {
      if (centers.length > 1) {
        hasDuplicates = true
        console.log(`DUPLICATE CODE: ${code}`)
        centers.forEach((cc: any, idx: number) => {
          console.log(`  [${idx + 1}] ID: ${cc.id}, Description: ${cc.description}, Status: ${cc.status}, Created: ${cc.createdAt}`)
        })
        console.log('')
      }
    }

    if (!hasDuplicates) {
      console.log('No duplicate codes found.')
    }

    console.log('\nAll cost centers:')
    costCenters.forEach(cc => {
      console.log(`${cc.code} - ${cc.description} (${cc.status})`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()
