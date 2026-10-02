import { useEffect, useState } from 'react'

export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Observatório do Turismo SRS` : 'Observatório do Turismo · Santa Rita do Sapucaí'
  }, [titulo])
}

// Fecha um menu ao clicar fora dele ou apertar Esc
export function useFecharFora(ref, aberto, fechar) {
  useEffect(() => {
    if (!aberto) return
    const aoClicar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) fechar()
    }
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar()
    }
    document.addEventListener('pointerdown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [ref, aberto, fechar])
}

// Trava a rolagem da página enquanto uma gaveta está aberta
export function useTravarRolagem(ativo) {
  useEffect(() => {
    if (!ativo) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [ativo])
}

export function useRolou(limite = 8) {
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const verificar = () => setRolou(window.scrollY > limite)
    verificar()
    window.addEventListener('scroll', verificar, { passive: true })
    return () => window.removeEventListener('scroll', verificar)
  }, [limite])
  return rolou
}
