// Computes one iteration of pressure approximation using the Jacobi method.

precision mediump float;

uniform sampler2D divergence_field;
uniform sampler2D pressure_field;
uniform vec2 field_size;

varying vec2 surface_texcoord;

// WebGL 1.0 doesn't support use of the wrapping parameter GL_REPEAT for
// non-power-of-two texture sizes. This manually implements that feature.
vec4 sample_wrap(sampler2D input_sampler, vec2 texcoord)
{
    return texture2D(input_sampler, fract(texcoord));
}

void main()
{
    vec2 pixel_size = 1.0 / field_size;
    float divergence = texture2D(divergence_field, surface_texcoord).x;
    float west = sample_wrap(pressure_field, surface_texcoord - vec2(2.0 * pixel_size.x, 0.0)).x;
    float east = sample_wrap(pressure_field, surface_texcoord + vec2(2.0 * pixel_size.x, 0.0)).x;
    float south = sample_wrap(pressure_field, surface_texcoord - vec2(0.0, 2.0 * pixel_size.y)).x;
    float north = sample_wrap(pressure_field, surface_texcoord + vec2(0.0, 2.0 * pixel_size.y)).x;
    float pressure = 0.25 * (divergence + west + east + south + north);
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}