import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Truck, Package, MapPin } from "lucide-react";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Truck className="w-12 h-12 text-primary-600" />
              <h1 className="text-5xl font-bold text-primary-600 dark:text-primary-400">
                NexusTransit
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">Sistema de Gestão Logística</p>
          </header>

          {/* Greeting Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-glass animate-fade-in mb-12">
            <div className="mb-6">
              <label
                htmlFor="greet-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Digite seu nome:
              </label>
              <input
                id="greet-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                onKeyPress={(e) => e.key === "Enter" && greet()}
                placeholder="Nome..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                         dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            <button
              onClick={greet}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold 
                       py-3 px-6 rounded-lg transition-all duration-200 
                       transform hover:scale-105 active:scale-95 
                       shadow-lg hover:shadow-xl"
            >
              Saudar
            </button>

            {greetMsg && (
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg animate-fade-in">
                <p className="text-center text-lg text-primary-700 dark:text-primary-300 font-medium">
                  {greetMsg}
                </p>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Tauri 2.0",
                description: "Framework moderno e performático",
                icon: Truck,
                color: "primary",
              },
              {
                title: "React + TypeScript",
                description: "Desenvolvimento type-safe",
                icon: Package,
                color: "secondary",
              },
              {
                title: "Tailwind CSS",
                description: "Estilização moderna e responsiva",
                icon: MapPin,
                color: "info",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg 
                         hover:shadow-2xl transition-all duration-300 
                         transform hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="w-10 h-10 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
