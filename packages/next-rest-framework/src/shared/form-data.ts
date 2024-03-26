import { type NextApiRequest } from 'next/types';
import { Formidable } from 'formidable';
import { readFileSync } from 'fs';

export const parseMultiPartFormData = async (req: NextApiRequest) =>
  await new Promise<FormData>((resolve, reject) => {
    const form = new Formidable();

    setTimeout(() => {
      reject(new Error('Form parsing timeout.'));
    }, 10000);

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const formData = new FormData();

      Object.entries(fields).forEach(([key, value]) => {
        if (value?.[0]) {
          formData.append(key, value[0]);
        }
      });

      Object.entries(files).forEach(([key, fileArray]) => {
        if (fileArray && fileArray.length > 0) {
          fileArray.forEach((file) => {
            const fileContent = readFileSync(file.filepath);

            const blob = new Blob([fileContent], {
              type: file.mimetype ?? ''
            });

            formData.append(key, blob, file.originalFilename ?? '');
          });
        }
      });

      resolve(formData);
    });
  });
