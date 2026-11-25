'use client';
import { useEffect } from 'react';
export default function ClearCart() { useEffect(() => { localStorage.removeItem('stitch-cart'); }, []); return null; }
