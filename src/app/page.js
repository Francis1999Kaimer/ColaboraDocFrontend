// src/app/page.js
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
   
      <div className="w-full mx-auto px-6 pt-4" >
        <img
          src="/images/fondo.jpg"
          alt="Imagen principal"
          className="w-full max-h-[500px] object-cover rounded-lg "
        />
      </div>

  
      <section className="text-center px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Gestión Documentaria para Proyectos de Construcción
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Plataforma integral para colaborar en documentación de proyectos
        </p>

    
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-3xl mb-2">🗂️</div>
            <h3 className="font-semibold text-lg mb-1">Control de versiones</h3>
            <p className="text-gray-600">
              Realiza un seguimiento de los cambios y accede a las versiones anteriores
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold text-lg mb-1">Gestión segura</h3>
            <p className="text-gray-600">
              Protege tus documentos con permisos y autenticación robusta
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-lg mb-1">Gestión colaborativa</h3>
            <p className="text-gray-600">
              Trabaja en equipo con herramientas diseñadas para la construcción
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <div className="text-center">
            <div className="text-3xl mb-2">🌐</div>
            <h3 className="font-semibold text-lg mb-1">Portabilidad</h3>
            <p className="text-gray-600">
              Acceso web desde cualquier dispositivo
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}