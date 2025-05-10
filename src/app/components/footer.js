export default function Footer() {
 
  return (
    <>
      
      <footer className="mt-auto bg-gray-100 text-gray-600 py-4 px-6 text-center">
          <p>&copy; 2025 ColaboraDoc. Todos los derechos reservados.</p>
          <div className="mt-2 space-x-4">
            <a href="/privacy" className="hover:text-blue-600">Política de privacidad</a>
            <a href="/terms" className="hover:text-blue-600">Términos y condiciones</a>
          </div>
        </footer>
  
    </>
  );
}