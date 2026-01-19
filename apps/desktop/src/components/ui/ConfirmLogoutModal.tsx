import { Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { LogOut } from "lucide-react";

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmLogoutModal({ isOpen, onConfirm, onCancel }: ConfirmLogoutModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 mb-4 ring-8 ring-red-50/50">
                    <LogOut className="h-6 w-6 text-red-600" aria-hidden="true" strokeWidth={2} />
                  </div>

                  <DialogTitle as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-2">
                    Sair da conta
                  </DialogTitle>

                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-500">
                      Tem certeza que deseja sair da sua conta? <br />
                      Você precisará fazer login novamente.
                    </p>
                  </div>

                  <div className="mt-8 flex gap-3 w-full sm:w-auto min-w-75">
                    <button
                      type="button"
                      className="flex-1 justify-center rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-500 transition-colors cursor-pointer"
                      onClick={onCancel}
                    >
                      Não, cancelar
                    </button>
                    <button
                      type="button"
                      className="flex-1 justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors cursor-pointer"
                      onClick={onConfirm}
                    >
                      Sim, sair
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
