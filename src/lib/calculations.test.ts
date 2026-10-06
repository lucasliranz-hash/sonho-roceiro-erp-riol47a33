import { describe, it, expect } from 'vitest'
import { computeLotAnimalMovement, computeLotLiveQuantity } from '@/lib/calculations'
import { Lot, Mortality, Slaughtering, Sale } from '@/types/farm'

describe('Regra definitiva de Quantidade Viva e Movimentação de Animais', () => {
  const baseLot: Lot = {
    id: 'l-test-1',
    code: 'L-0003',
    name: 'Caipira pescoço pelado',
    type: 'Poedeiras',
    startDate: '2025-01-01',
    origin: 'Interna',
    supplier: 'Próprio',
    breed: 'Pescoço Pelado',
    initialQuantity: 11,
    currentQuantity: 11,
    initialAgeDays: 1,
    acquisitionCost: 0,
    purpose: 'Postura',
    status: 'Ativo',
  }

  it('Lote 11 aves sem eventos = 11/11 vivas e zeros nos eventos', () => {
    const movement = computeLotAnimalMovement(baseLot, [], [], [])
    expect(movement.initialQuantity).toBe(11)
    expect(movement.entries).toBe(0)
    expect(movement.mortality).toBe(0)
    expect(movement.slaughter).toBe(0)
    expect(movement.otherExits).toBe(0)
    expect(movement.liveQuantity).toBe(11)
    expect(computeLotLiveQuantity(baseLot, [], [], [])).toBe(11)
  })

  it('2 mortalidades = 9/11 vivas', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]

    const movement = computeLotAnimalMovement(baseLot, mortalities, [], [])
    expect(movement.mortality).toBe(2)
    expect(movement.liveQuantity).toBe(9)
    expect(computeLotLiveQuantity(baseLot, mortalities, [], [])).toBe(9)
  })

  it('2 mortalidades + abate 3 = 6/11 vivas', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]
    const slaughters: Slaughtering[] = [
      {
        id: 's-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        species: 'Galinha',
        date: '2025-01-15',
        quantityAnimals: 3,
        destination: 'Venda',
        totalCost: 30,
      },
    ]

    const movement = computeLotAnimalMovement(baseLot, mortalities, slaughters, [])
    expect(movement.mortality).toBe(2)
    expect(movement.slaughter).toBe(3)
    expect(movement.liveQuantity).toBe(6)
    expect(computeLotLiveQuantity(baseLot, mortalities, slaughters, [])).toBe(6)
  })

  it('Excluir abate => volta a 9/11 vivas (devolução na exclusão)', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]
    // Abate excluído (soft-delete ou removido da lista)
    const slaughters: Slaughtering[] = []

    const movement = computeLotAnimalMovement(baseLot, mortalities, slaughters, [])
    expect(movement.mortality).toBe(2)
    expect(movement.slaughter).toBe(0)
    expect(movement.liveQuantity).toBe(9)
    expect(computeLotLiveQuantity(baseLot, mortalities, slaughters, [])).toBe(9)
  })

  it('Excluir mortalidades => 11/11 vivas', () => {
    const movement = computeLotAnimalMovement(baseLot, [], [], [])
    expect(movement.mortality).toBe(0)
    expect(movement.slaughter).toBe(0)
    expect(movement.liveQuantity).toBe(11)
  })

  it('Editar mortalidade 2 -> 1 => 10/11 vivas', () => {
    const editedMortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 1,
        cause: 'Causa natural (ajustado)',
      },
    ]
    const movement = computeLotAnimalMovement(baseLot, editedMortalities, [], [])
    expect(movement.mortality).toBe(1)
    expect(movement.liveQuantity).toBe(10)
  })

  it('Editar initialQuantity do lote 5 -> 11 sem saídas => viva acompanha para 11', () => {
    const updatedLot: Lot = {
      ...baseLot,
      initialQuantity: 11,
    }
    const movement = computeLotAnimalMovement(updatedLot, [], [], [])
    expect(movement.initialQuantity).toBe(11)
    expect(movement.liveQuantity).toBe(11)
  })

  it('Respeita soft-delete de eventos com deleted_at', () => {
    const mortalitiesWithDeleted = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
        deleted_at: '2025-01-11T10:00:00Z',
      },
    ] as any
    const movement = computeLotAnimalMovement(baseLot, mortalitiesWithDeleted, [], [])
    expect(movement.mortality).toBe(0)
    expect(movement.liveQuantity).toBe(11)
  })

  it('TESTE DE ACEITAÇÃO A: Lote 5 aves vivas -> vender 1 ave viva -> lote = 4. Cancelar venda -> lote = 5', () => {
    const lot5: Lot = {
      ...baseLot,
      id: 'l-teste-a',
      initialQuantity: 5,
      currentQuantity: 5,
    }

    // 1. Sem eventos = 5 vivas
    expect(computeLotLiveQuantity(lot5, [], [], [])).toBe(5)

    // 2. Vender 1 ave viva
    const saleLive: Sale = {
      id: 'sal-live-1',
      date: '2025-02-01',
      customerName: 'Comprador A',
      product: 'Frangos vivos',
      birdType: 'LIVE',
      lotId: 'l-teste-a',
      quantity: 1,
      unitPrice: 35,
      totalPrice: 35,
      paymentMethod: 'Pix',
      isPaid: true,
      source_type: 'MANUAL',
    }

    const movementAfterSale = computeLotAnimalMovement(lot5, [], [], [saleLive])
    expect(movementAfterSale.otherExits).toBe(1)
    expect(movementAfterSale.liveQuantity).toBe(4)
    expect(computeLotLiveQuantity(lot5, [], [], [saleLive])).toBe(4)

    // 3. Cancelar a venda (removida ou soft-delete com deleted_at)
    const saleLiveDeleted: Sale = {
      ...saleLive,
      deleted_at: '2025-02-02T10:00:00Z',
    } as any

    const movementAfterCancel = computeLotAnimalMovement(lot5, [], [], [saleLiveDeleted])
    expect(movementAfterCancel.otherExits).toBe(0)
    expect(movementAfterCancel.liveQuantity).toBe(5)
    expect(computeLotLiveQuantity(lot5, [], [], [saleLiveDeleted])).toBe(5)
  })

  it('TESTE DE ACEITAÇÃO B: Abater 1 ave -> lote vivo = 4. Vender essa ave abatida -> lote vivo CONTINUA 4 (sem dupla baixa)', () => {
    const lot5: Lot = {
      ...baseLot,
      id: 'l-teste-b',
      initialQuantity: 5,
      currentQuantity: 5,
    }

    // 1. Abate de 1 ave
    const slaughter: Slaughtering = {
      id: 'sla-teste-b',
      lotId: 'l-teste-b',
      species: 'Frango',
      date: '2025-02-05',
      quantityAnimals: 1,
      destination: 'Consumo próprio',
      totalCost: 18.5,
    }

    const movementAfterSlaughter = computeLotAnimalMovement(lot5, [], [slaughter], [])
    expect(movementAfterSlaughter.slaughter).toBe(1)
    expect(movementAfterSlaughter.liveQuantity).toBe(4)

    // 2. Venda da ave abatida (seja pelo fluxo de abate ou venda avulsa de carne/frango abatido)
    const saleSlaughtered: Sale = {
      id: 'sal-abat-1',
      date: '2025-02-06',
      customerName: 'Cliente Frango Abatido',
      product: 'Frangos abatidos',
      birdType: 'SLAUGHTERED',
      lotId: 'l-teste-b',
      slaughterId: 'sla-teste-b',
      quantity: 1,
      unitPrice: 30,
      totalPrice: 30,
      paymentMethod: 'Pix',
      isPaid: true,
      source_type: 'MANUAL',
    }

    // A venda de ave abatida NÃO deve gerar baixa no lote de ave viva (já foi baixada no abate)
    const movementAfterSale = computeLotAnimalMovement(lot5, [], [slaughter], [saleSlaughtered])
    expect(movementAfterSale.slaughter).toBe(1)
    expect(movementAfterSale.otherExits).toBe(0) // Não baixou ave viva adicionalmente
    expect(movementAfterSale.liveQuantity).toBe(4) // Saldo continua 4!
    expect(computeLotLiveQuantity(lot5, [], [slaughter], [saleSlaughtered])).toBe(4)
  })

  it('Venda real sal-1791298889479 (R$ 30, "Frangos abatidos"): tratada como produto abatido sem baixa no saldo de ave viva', () => {
    const lotReal: Lot = {
      ...baseLot,
      id: 'l-real-test',
      initialQuantity: 10,
      currentQuantity: 10,
    }

    // Venda real sal-1791298889479
    const realSale: Sale = {
      id: 'sal-1791298889479',
      date: '2026-10-04',
      isPaid: true,
      product: 'Frangos abatidos',
      quantity: 1,
      unitPrice: 30,
      totalPrice: 30,
      source_type: 'MANUAL',
      customerName: 'Cliente Final',
      paymentMethod: 'Pix',
      lotId: 'l-real-test',
    }

    const movement = computeLotAnimalMovement(lotReal, [], [], [realSale])
    // Como o produto é "Frangos abatidos", a regra de cálculo classifica como NÃO ave viva
    expect(movement.otherExits).toBe(0)
    expect(movement.liveQuantity).toBe(10)
    expect(computeLotLiveQuantity(lotReal, [], [], [realSale])).toBe(10)
  })
})
